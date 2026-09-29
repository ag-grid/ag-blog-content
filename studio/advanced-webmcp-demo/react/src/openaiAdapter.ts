/**
 * OpenAI Responses API adapter for AG Studio.
 *
 * This is example code - copy it into your project and adapt as needed.
 * It maps between AG Studio's AI types and the OpenAI Responses API,
 * handling encoding (AG → OpenAI), decoding (OpenAI → AG), and SSE streaming.
 */
import type {
    AgAiConversationItem,
    AgAiEvent,
    AgAiOutputContent,
    AgAiOutputItem,
    AgAiOutputMessage,
    AgAiReasoningItem,
    AgAiToolSchema,
    AgLlmAdapter,
    AgLlmJsonFormat,
    AgLlmRequest,
    AgLlmResponse,
    AgLlmResponseHandler,
    AgLlmTextFormat,
} from 'ag-studio';

// =============================================================================
// OpenAI Types (hand-written, minimal)
// =============================================================================

interface OpenAiAdapterOptions {
    key?: string;
    endpoint?: string;
    model?: string;
    organization?: string;
}

interface OpenAiConfig {
    endpoint: string;
    key?: string;
    model: string;
    organization?: string;
}

// =============================================================================
// JSON Schema → OpenAI strict-mode subset
// =============================================================================
//
// The Shape library emits JSON Schema 2020-12. OpenAI's Responses API in
// `strict: true` mode accepts only a narrow subset. This transform bridges the
// two so docs examples work against OpenAI without forcing Shape authors to
// know the quirks.
//
// What OpenAI accepts: object/array/string/number/integer/boolean/enum/anyOf,
// `$ref` + `$defs` (including recursive), `additionalProperties: false`, and
// the standard string/number/array constraint keywords. Every key in
// `properties` must appear in `required`; optional fields are encoded as a
// nullable type. Open-ended `additionalProperties: <schema>` (i.e. Shape's
// `s.record(...)`) is **not** representable.

type JsonSchema = Record<string, unknown>;

const BANNED_KEYWORDS = [
    'allOf',
    'not',
    'oneOf',
    'if',
    'then',
    'else',
    'prefixItems',
    'patternProperties',
    'propertyNames',
    'unevaluatedProperties',
    'unevaluatedItems',
    'dependentSchemas',
    'dependentRequired',
    'contains',
] as const;

function isSchema(value: unknown): value is JsonSchema {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Shape encodes "undefined" (used in `union(T, undefined)` to mark optionality) as the
// sentinel `{ not: {} }`. OpenAI doesn't allow `not`, so strip these from any `anyOf`
// branches; the surrounding object handler turns the remaining schema nullable for
// optional properties.
function isUndefinedSentinel(s: unknown): boolean {
    if (!isSchema(s)) return false;
    return Object.keys(s).length === 1 && isSchema(s.not) && Object.keys(s.not as JsonSchema).length === 0;
}

function stripUndefinedSentinel(schema: JsonSchema): JsonSchema {
    if (!Array.isArray(schema.anyOf)) return schema;
    const filtered = (schema.anyOf as unknown[]).filter((b) => !isUndefinedSentinel(b));
    if (filtered.length === schema.anyOf.length) return schema;
    if (filtered.length === 0) {
        throw new Error('toOpenAiSchema: schema reduces to `undefined`-only - nothing to express');
    }
    const { anyOf: _, ...rest } = schema;
    if (filtered.length === 1 && isSchema(filtered[0])) {
        return { ...filtered[0], ...rest } as JsonSchema;
    }
    return { ...rest, anyOf: filtered as JsonSchema[] };
}

function inferTypeFromValue(v: unknown): string | undefined {
    if (v === null) return 'null';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
    return undefined;
}

function makeNullable(schema: JsonSchema): JsonSchema {
    if (typeof schema.type === 'string') {
        return schema.type === 'null' ? schema : { ...schema, type: [schema.type, 'null'] };
    }
    if (Array.isArray(schema.type)) {
        return schema.type.includes('null') ? schema : { ...schema, type: [...schema.type, 'null'] };
    }
    if (Array.isArray(schema.anyOf)) {
        const branches = schema.anyOf as JsonSchema[];
        const hasNull = branches.some((b) => isSchema(b) && b.type === 'null');
        return hasNull ? schema : { ...schema, anyOf: [...branches, { type: 'null' }] };
    }
    return { anyOf: [schema, { type: 'null' }] };
}

function transformSchema(schema: JsonSchema): JsonSchema {
    schema = stripUndefinedSentinel(schema);

    // OpenAI strict mode rejects any sibling keyword on `$ref` (description, examples, etc.).
    // Shape authors apply per-callsite descriptions on the outside of the def - preserve `$ref`
    // itself, drop everything else; the description lives inside the referenced `$def` via the
    // first emission.
    if ('$ref' in schema) {
        const { $ref, $defs } = schema as JsonSchema & { $ref: unknown };
        return $defs !== undefined ? { $ref, $defs } : { $ref };
    }

    for (const kw of BANNED_KEYWORDS) {
        if (kw in schema) {
            throw new Error(`toOpenAiSchema: '${kw}' is not supported by OpenAI strict mode`);
        }
    }

    if ('const' in schema) {
        const { const: literalValue, ...rest } = schema as JsonSchema & { const: unknown };
        const inferred = inferTypeFromValue(literalValue);
        const out: JsonSchema = { ...rest, enum: [literalValue] };
        if (out.type == null && inferred != null) out.type = inferred;
        return transformSchema(out);
    }

    const out: JsonSchema = { ...schema };

    if (Array.isArray(out.anyOf)) {
        out.anyOf = (out.anyOf as JsonSchema[]).map((branch) => (isSchema(branch) ? transformSchema(branch) : branch));
    }

    if (isSchema(out.$defs)) {
        const transformedDefs: JsonSchema = {};
        for (const [k, v] of Object.entries(out.$defs as JsonSchema)) {
            transformedDefs[k] = isSchema(v) ? transformSchema(v) : v;
        }
        out.$defs = transformedDefs;
    }

    if (out.type === 'object' || isSchema(out.properties)) {
        if ('additionalProperties' in out && out.additionalProperties !== false) {
            throw new Error(
                'toOpenAiSchema: open-ended `additionalProperties` (e.g. s.record(...)) cannot be expressed in OpenAI strict mode'
            );
        }
        const properties = isSchema(out.properties) ? out.properties : {};
        const required = new Set(Array.isArray(out.required) ? (out.required as string[]) : []);
        const newProperties: JsonSchema = {};
        for (const [key, propSchema] of Object.entries(properties)) {
            const transformed = isSchema(propSchema) ? transformSchema(propSchema) : propSchema;
            newProperties[key] = required.has(key)
                ? transformed
                : isSchema(transformed)
                  ? makeNullable(transformed)
                  : transformed;
        }
        out.properties = newProperties;
        out.required = Object.keys(newProperties);
        out.additionalProperties = false;
    }

    // Array items keep their real schema: only optional PROPERTIES need the required+nullable
    // rewrite. Advertising nullable items invites the model to emit `[null]` for values the
    // AG-side shapes reject.
    if (isSchema(out.items)) {
        out.items = transformSchema(out.items);
    }

    return out;
}

function toOpenAiSchema(schema: JsonSchema): JsonSchema {
    if (Array.isArray(schema.anyOf) && schema.type !== 'object' && !isSchema(schema.properties)) {
        throw new Error(
            'toOpenAiSchema: root schema cannot be `anyOf` - wrap in an object (e.g. `s.object({ value: ... })`)'
        );
    }
    return transformSchema(schema);
}

// =============================================================================
// Encoding: AG → OpenAI
// =============================================================================

function encodeConversationItems(items: AgAiConversationItem[]): unknown[] {
    return items.map((item) => {
        if (item.kind === 'input' && item.type === 'message') {
            return {
                type: 'message',
                role: item.role,
                status: item.status,
                content: item.content.map((c) => {
                    switch (c.type) {
                        case 'text':
                            return { type: 'input_text', text: c.text };
                        case 'image':
                            return {
                                type: 'input_image',
                                detail: c.detail,
                                file_id: c.fileId ?? null,
                                image_url: c.imageUrl ?? null,
                            };
                        case 'file':
                            return {
                                type: 'input_file',
                                file_id: c.fileId ?? null,
                                file_data: c.fileData,
                                file_url: c.fileUrl,
                                filename: c.filename,
                            };
                    }
                }),
            };
        }

        if (item.type === 'function_call_output') {
            return {
                type: 'function_call_output',
                call_id: item.callId,
                output: item.output,
                status: item.status,
            };
        }

        if (item.kind === 'output' && item.type === 'message') {
            // No `id`: replayed history is reconstructed conversational context, not a resumed
            // OpenAI response. Echoing the original `msg_…` id makes the API treat it as response
            // state and demand the linked `reasoning` item (which a view-derived history lacks).
            return {
                type: 'message',
                role: 'assistant',
                status: item.status,
                content: item.content.map((c) => {
                    if (c.type === 'text') {
                        return {
                            type: 'output_text',
                            text: c.text,
                            annotations: c.annotations.map((ann) => {
                                switch (ann.type) {
                                    case 'file_path':
                                        return { type: 'file_path', file_id: ann.fileId, index: ann.index };
                                    case 'file_citation':
                                        return {
                                            type: 'file_citation',
                                            file_id: ann.fileId,
                                            index: ann.index,
                                            filename: ann.filename,
                                        };
                                    case 'url_citation':
                                        return {
                                            type: 'url_citation',
                                            url: ann.url,
                                            start_index: ann.startIndex,
                                            end_index: ann.endIndex,
                                            title: ann.title,
                                        };
                                    case 'container_file_citation':
                                        return {
                                            type: 'container_file_citation',
                                            container_id: ann.containerId,
                                            file_id: ann.fileId,
                                            start_index: ann.startIndex,
                                            end_index: ann.endIndex,
                                            filename: ann.filename,
                                        };
                                }
                            }),
                        };
                    }
                    return { type: 'refusal', refusal: c.refusal };
                }),
            };
        }

        if (item.kind === 'output' && item.type === 'function_call') {
            // No `id` (same reason as the assistant message above): `call_id` alone pairs the call
            // with its `function_call_output`, and a reconstructed `id` isn't a valid `fc_…` anyway.
            return {
                type: 'function_call',
                call_id: item.callId,
                name: item.name,
                arguments: item.arguments,
                status: item.status,
            };
        }

        if (item.kind === 'output' && item.type === 'reasoning') {
            return {
                id: item.id,
                type: 'reasoning',
                summary: item.summary.map((s) => ({ type: 'summary_text', text: s.text })),
                content: item.content?.map((c) => ({ type: 'reasoning_text', text: c.text })),
            };
        }

        throw new Error(`Unknown conversation item type: ${(item as { type: string }).type}`);
    });
}

// =============================================================================
// Decoding: OpenAI → AG
// =============================================================================

// `toOpenAiSchema` rewrites optional properties as required + nullable to satisfy
// OpenAI strict mode, so the model returns `null` for unset optionals. AG-side
// validation treats those fields as optional (not nullable), so strip `null`s
// from tool-call argument payloads on the way back. Only object PROPERTIES are
// stripped: a null array item is either a genuinely nullable value that must
// survive (e.g. a rank filter's `[10, null]` bounds) or invalid input that
// AG-side validation should report rather than have silently deleted.
function stripNulls(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((v) => stripNulls(v));
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            if (v === null) continue;
            out[k] = stripNulls(v);
        }
        return out;
    }
    return value;
}

function stripNullsFromToolArgs(argsJson: string): string {
    if (!argsJson) return argsJson;
    let parsed: unknown;
    try {
        parsed = JSON.parse(argsJson);
    } catch {
        return argsJson;
    }
    return JSON.stringify(stripNulls(parsed));
}

function decodeAnnotations(annotations: any[]): any[] {
    return (annotations ?? []).map((ann: any) => {
        if (ann.type === 'file_path') {
            return { type: 'file_path', fileId: ann.file_id, index: ann.index };
        }
        if (ann.type === 'file_citation') {
            return { type: 'file_citation', fileId: ann.file_id, index: ann.index, filename: ann.filename };
        }
        if (ann.type === 'url_citation') {
            return {
                type: 'url_citation',
                url: ann.url,
                startIndex: ann.start_index,
                endIndex: ann.end_index,
                title: ann.title,
            };
        }
        if (ann.type === 'container_file_citation') {
            return {
                type: 'container_file_citation',
                containerId: ann.container_id,
                fileId: ann.file_id,
                startIndex: ann.start_index,
                endIndex: ann.end_index,
                filename: ann.filename,
            };
        }
        return ann;
    });
}

function decodeOutputContent(input: Record<string, any>): AgAiOutputContent {
    if (input.type === 'output_text') {
        return {
            type: 'text',
            text: input.text,
            annotations: decodeAnnotations(input.annotations),
        };
    }
    return input as AgAiOutputContent;
}

function decodeOutputItem(input: Record<string, any>): AgAiOutputItem {
    switch (input.type) {
        case 'message': {
            const message: AgAiOutputMessage = {
                id: input.id ?? '',
                kind: 'output',
                type: 'message',
                role: 'assistant',
                status: input.status ?? 'completed',
                content: input.content.map(decodeOutputContent),
            };
            return message;
        }
        case 'function_call':
            return {
                id: input.id ?? '',
                kind: 'output',
                type: 'function_call',
                callId: input.call_id,
                name: input.name,
                arguments: stripNullsFromToolArgs(input.arguments ?? ''),
                status: input.status,
            };
        case 'reasoning': {
            const reasoning: AgAiReasoningItem = {
                id: input.id ?? '',
                kind: 'output',
                type: 'reasoning',
                summary: input.summary.map((s: any) => ({ type: 'summary', text: s.text })),
                content: input.content?.map((c: any) => ({ type: 'text', text: c.text })),
            };
            return reasoning;
        }
        default:
            throw new Error(`Unknown output item type: ${input.type}`);
    }
}

function decodeResponse(input: Record<string, any>): AgLlmResponse {
    return {
        id: input.id,
        createdAt: input.created_at,
        model: input.model,
        incompleteDetails: input.incomplete_details ? { reason: input.incomplete_details.reason } : undefined,
        output: input.output.map(decodeOutputItem),
        status: input.status,
        error: input.error ? { code: input.error.code, message: input.error.message } : undefined,
        usage: input.usage
            ? {
                  inputTokens: input.usage.input_tokens,
                  outputTokens: input.usage.output_tokens,
                  totalTokens: input.usage.total_tokens,
                  reasoningTokens: input.usage.output_tokens_details?.reasoning_tokens,
                  cachedInputTokens: input.usage.input_tokens_details?.cached_tokens,
                  cacheWriteTokens: input.usage.input_tokens_details?.cache_write_tokens,
              }
            : undefined,
    };
}

/** What a turn produced besides its events: the final response, or the failure that ended it. */
interface TurnOutcome {
    response?: AgLlmResponse;
    error?: Error;
}

/**
 * Translates the OpenAI Responses stream into the events AG Studio reads.
 *
 * The provider is item-and-index shaped; AG Studio is message-shaped, keyed by id. The only state
 * needed to bridge them is the item id of each open item, since argument deltas arrive against the
 * item while tool events are keyed by the call.
 */
class ResponseStreamTranslator {
    private readonly callIdByItemId = new Map<string, string>();
    private readonly kindByItemId = new Map<string, 'message' | 'reasoning' | 'function_call'>();

    /** The events one SSE payload maps to. Anything not recognised is ignored, not an error. */
    translate(input: Record<string, any>, outcome: TurnOutcome): AgAiEvent[] {
        switch (input.type) {
            case 'response.output_item.added':
                return this.open(input.item);
            case 'response.output_item.done':
                return this.close(input.item);
            case 'response.output_text.delta':
            case 'response.refusal.delta':
                return [{ type: 'TEXT_MESSAGE_CONTENT', messageId: input.item_id, delta: input.delta }];
            case 'response.reasoning_text.delta':
            case 'response.reasoning_summary_text.delta':
                return [{ type: 'REASONING_MESSAGE_CONTENT', messageId: input.item_id, delta: input.delta }];
            case 'response.function_call_arguments.delta': {
                const toolCallId = this.callIdByItemId.get(input.item_id);
                return toolCallId ? [{ type: 'TOOL_CALL_ARGS', toolCallId, delta: input.delta }] : [];
            }
            case 'response.completed':
                outcome.response = decodeResponse(input.response);
                return [];
            case 'response.failed':
            case 'response.incomplete':
                outcome.error ??= new Error(input.response?.error?.message ?? `Response ${input.type}.`);
                return [];
            case 'error':
                outcome.error ??= new Error(`${input.code ?? 'api_error'}: ${input.message}`);
                return [];
            default:
                return [];
        }
    }

    private open(item: Record<string, any>): AgAiEvent[] {
        switch (item?.type) {
            case 'message':
                this.kindByItemId.set(item.id, 'message');
                return [{ type: 'TEXT_MESSAGE_START', messageId: item.id, role: 'assistant' }];
            case 'reasoning':
                this.kindByItemId.set(item.id, 'reasoning');
                return [{ type: 'REASONING_MESSAGE_START', messageId: item.id, role: 'reasoning' }];
            case 'function_call':
                this.kindByItemId.set(item.id, 'function_call');
                this.callIdByItemId.set(item.id, item.call_id);
                return [{ type: 'TOOL_CALL_START', toolCallId: item.call_id, toolCallName: item.name }];
            default:
                return [];
        }
    }

    private close(item: Record<string, any>): AgAiEvent[] {
        switch (this.kindByItemId.get(item?.id)) {
            case 'message':
                return [{ type: 'TEXT_MESSAGE_END', messageId: item.id }];
            case 'reasoning':
                return [{ type: 'REASONING_MESSAGE_END', messageId: item.id }];
            case 'function_call': {
                const toolCallId = this.callIdByItemId.get(item.id);
                return toolCallId ? [{ type: 'TOOL_CALL_END', toolCallId }] : [];
            }
            default:
                return [];
        }
    }
}

// =============================================================================
// Stream Processor
// =============================================================================

async function* streamOpenAi(
    config: OpenAiConfig,
    requestBody: Record<string, unknown>,
    outcome: TurnOutcome,
    signal?: AbortSignal
): AsyncIterableIterator<AgAiEvent> {
    const translator = new ResponseStreamTranslator();
    const emit = (payload: string): AgAiEvent[] => {
        if (payload === '[DONE]') {
            return [];
        }
        try {
            const parsed = JSON.parse(payload);
            return parsed.type === 'keepalive' ? [] : translator.translate(parsed, outcome);
        } catch (error) {
            outcome.error ??= error instanceof Error ? error : new Error(String(error));
            return [];
        }
    };

    const response = await fetch(`${config.endpoint}/responses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(config.key && { Authorization: `Bearer ${config.key}` }),
            ...(config.organization && { 'OpenAI-Organization': config.organization }),
        },
        body: JSON.stringify(requestBody),
        signal,
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
            for (const line of frame.split('\n')) {
                if (line.startsWith('data: ')) {
                    yield* emit(line.slice(6));
                }
            }
        }
    }
}

// =============================================================================
// Request Builder
// =============================================================================

function prepareToolChoice(
    toolChoice: AgLlmRequest['toolChoice']
): 'auto' | 'none' | 'required' | { type: 'function'; name: string } | undefined {
    if (!toolChoice) return undefined;
    if (typeof toolChoice === 'string') return toolChoice;
    return { type: 'function', name: toolChoice.name };
}

function prepareResponseFormat(format: AgLlmTextFormat | AgLlmJsonFormat): Record<string, unknown> {
    if (format.type === 'text') return { type: 'text' };
    return {
        type: 'json_schema',
        name: format.name,
        description: format.description,
        schema: toOpenAiSchema(format.schema as JsonSchema),
        strict: true,
    };
}

function runRequest(config: OpenAiConfig, request: AgLlmRequest, signal?: AbortSignal): AgLlmResponseHandler {
    const { tools = [], toolChoice, responseFormat, input, model, ...rest } = request;

    const requestBody: Record<string, unknown> = {
        ...rest,
        input: encodeConversationItems(input),
        // `request.model` carries whichever model the reader picked, and is absent when the chat
        // offers no choice - so the adapter's own model is the fallback, not an override.
        model: model?.id ?? config.model,
        stream: true,
        tools: tools.map((tool: AgAiToolSchema) => ({
            type: 'function' as const,
            name: tool.name,
            description: tool.description,
            parameters: toOpenAiSchema(tool.parameters as unknown as JsonSchema),
            strict: true,
        })),
        tool_choice: prepareToolChoice(toolChoice),
        text: { format: prepareResponseFormat(responseFormat!) },
        // Studio's effort ids are passed straight through as OpenAI's reasoning effort. A model
        // declared without efforts sends none, so the adapter's own default applies.
        reasoning: { effort: model?.effort ?? 'medium' },
        parallel_tool_calls: true,
    };

    const outcome: TurnOutcome = {};
    const streamIterator = streamOpenAi(config, requestBody, outcome, signal);

    let resolveComplete: (response: AgLlmResponse) => void;
    let rejectComplete: (error: Error) => void;

    const completePromise = new Promise<AgLlmResponse>((resolve, reject) => {
        resolveComplete = resolve;
        rejectComplete = reject;
    });

    // `complete` rejects on a failed turn: the host ends a run on a throw from here and reads
    // nothing off the response's own status.
    // A failed turn is reported once, through `complete`. Rethrowing as well would leave the
    // rejection unobserved whenever a consumer stops reading the stream before awaiting it - which
    // is exactly what happens on an HTTP error or a cancellation - and that surfaces as an unhandled
    // rejection rather than as the run's own error.
    async function* wrappedIterator(): AsyncIterableIterator<AgAiEvent> {
        try {
            yield* streamIterator;
        } catch (error) {
            outcome.error ??= error instanceof Error ? error : new Error(String(error));
        }
        if (outcome.error) {
            rejectComplete(outcome.error);
        } else if (outcome.response) {
            resolveComplete(outcome.response);
        } else {
            rejectComplete(new Error('Stream completed without a final response.'));
        }
    }

    // Marks the rejection observed for a consumer that abandons the stream and never awaits
    // `complete`; anyone who does await it still sees the failure.
    void completePromise.catch(() => {});

    const wrapped = wrappedIterator();

    return {
        stream: { [Symbol.asyncIterator]: () => wrapped },
        complete: completePromise,
    };
}

// =============================================================================
// Factory Function
// =============================================================================

export function openaiAdapter(options: OpenAiAdapterOptions): AgLlmAdapter {
    const config: OpenAiConfig = {
        endpoint: options.endpoint ?? 'https://api.openai.com/v1',
        key: options.key,
        model: options.model ?? 'gpt-5.4-mini',
        organization: options.organization,
    };

    return {
        executeTurn: (request: AgLlmRequest, options?: { signal?: AbortSignal }) =>
            runRequest(config, request, options?.signal),
    };
}
