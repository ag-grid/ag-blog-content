import type { AgAiChatSession, AgAiHarness, AgStudioApi } from 'ag-studio';

import type { WebMcpBridgedTool } from './webmcpBridge.ts';

export interface HandoffToolDeps {
    api: AgStudioApi;
    harness: AgAiHarness;
    log(line: string): void;
}

/** A run that never settles must not hold the browser agent's call open indefinitely. */
const RUN_TIMEOUT_MS = 120_000;

/** The text of the last thing the agent said, which is where the data agent leaves its findings. */
function lastAssistantText(session: AgAiChatSession): string | undefined {
    for (let i = session.messages.length - 1; i >= 0; --i) {
        const message = session.messages[i];
        if (message.role !== 'assistant') continue;
        const text = message.parts
            .flatMap((part) => (part.type === 'text' ? [part.text] : []))
            .join('\n')
            .trim();
        if (text !== '') return text;
    }
    return undefined;
}

/** Every tool the delegated run called, in order, so the page can show what the handoff did. */
function toolCallNames(session: AgAiChatSession): string[] {
    return session.messages.flatMap((message) =>
        message.parts.flatMap((part) => (part.type === 'tool_call' ? [part.toolCall.name] : []))
    );
}

/**
 * Waits for the run started by `sendMessage` to settle. The session reports no completion promise,
 * only a `changed` event and a status, so settling is inferred: the run has to have started before
 * a return to `idle` means anything, or a `changed` fired before the loop got going would read as
 * an instant, empty answer.
 */
function runSettled(session: AgAiChatSession, signal: AbortSignal): Promise<'idle' | 'error' | 'timeout'> {
    return new Promise((resolve) => {
        let started = session.status === 'running';

        const finish = (outcome: 'idle' | 'error' | 'timeout'): void => {
            clearTimeout(timer);
            session.removeEventListener('changed', onChange);
            signal.removeEventListener('abort', onAbort);
            resolve(outcome);
        };

        const onChange = (): void => {
            if (session.status === 'running') {
                started = true;
                return;
            }
            if (session.status === 'error') return finish('error');
            if (started && session.status === 'idle') return finish('idle');
        };

        const onAbort = (): void => {
            session.cancel();
            finish('timeout');
        };

        const timer = setTimeout(() => {
            session.cancel();
            finish('timeout');
        }, RUN_TIMEOUT_MS);

        session.addEventListener('changed', onChange);
        signal.addEventListener('abort', onAbort);
        onChange();
    });
}

/**
 * The handoff: one tool that puts a question to Studio's own data agent rather than answering it
 * from the browser agent's side.
 *
 * It is deliberately the narrow kind of handoff. The data agent queries and explains; it does not
 * build anything, so the browser agent keeps control of the dashboard and delegates only the part
 * that needs to know how this data is shaped. What it gets back is the agent's own summary, the
 * same text a reader would have seen in the chat panel.
 *
 * The conversation is left in the harness rather than deleted, so the thread is there in the chat
 * panel afterwards and the queries behind the answer can be read.
 */
export function createHandoffTool({ api, harness, log }: HandoffToolDeps): WebMcpBridgedTool {
    const tool = api.defineAiTool({
        name: 'ask_studio_analyst',
        description:
            "Put a question about this dashboard's data to Studio's own data analyst agent, which " +
            'knows the schema and writes the queries itself. Use it for questions about what the ' +
            'data contains or shows, rather than querying field by field.',
        params: (s) =>
            s.object({
                question: s.string({ description: 'The question, in plain language.' }),
            }),
        execute: async ({ question }, ctx) => {
            log(`ask_studio_analyst: ${question}`);
            const session = await harness.createThread({ agentId: 'data', title: 'Asked via WebMCP' });
            try {
                session.sendMessage(question);
                const outcome = await runSettled(session, ctx.signal);

                const calls = toolCallNames(session);
                log(`analyst ${outcome}, ${calls.length} tool call(s): ${calls.join(', ') || 'none'}`);

                if (outcome === 'timeout') {
                    return ctx.error('The analyst did not finish in time and the run was cancelled.');
                }
                if (outcome === 'error') {
                    return ctx.error(lastAssistantText(session) ?? 'The analyst run failed.');
                }
                const answer = lastAssistantText(session);
                if (answer == null) {
                    return ctx.error('The analyst finished without an answer.');
                }
                return ctx.success(answer, { threadId: session.threadId, toolCalls: calls });
            } finally {
                session.close();
            }
        },
    });

    // Not read-only: the data agent lists the expression tools, so answering a question can
    // leave a calculated field behind. Annotating it `readOnlyHint` would tell the browser agent
    // it is safe to call without asking, which is not true of a delegate that can write.
    return { tool, readOnly: false };
}
