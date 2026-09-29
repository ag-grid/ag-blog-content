import type { AgAiChatSession, AgAiHarness, AgStudioApi } from 'ag-studio';

import type { BridgedTool } from './webmcpBridge.ts';

export interface HandoffToolDeps {
    api: AgStudioApi;
    harness: AgAiHarness;
    log(line: string): void;
}

type RunOutcome = 'idle' | 'error' | 'timeout';

/** A run that never settles must not hold the browser agent's call open indefinitely. */
const RUN_TIMEOUT_MS = 120_000;

/** The text of the agent's last reply, which is where the data agent leaves its answer. */
function lastAssistantText(session: AgAiChatSession): string | undefined {
    for (const message of [...session.messages].reverse()) {
        if (message.role !== 'assistant') continue;
        const text = message.parts
            .flatMap((part) => (part.type === 'text' ? [part.text] : []))
            .join('\n')
            .trim();
        if (text !== '') return text;
    }
    return undefined;
}

/** The tools the delegated run called, in order. */
function toolCallNames(session: AgAiChatSession): string[] {
    return session.messages.flatMap((message) =>
        message.parts.flatMap((part) => (part.type === 'tool_call' ? [part.toolCall.name] : []))
    );
}

/**
 * Resolves when the session's current run finishes. The session only reports a status and a
 * `changed` event, so a return to `idle` counts only once the run has been seen `running`;
 * otherwise an early `changed` would read as an instant, empty answer.
 */
function runSettled(session: AgAiChatSession, signal: AbortSignal): Promise<RunOutcome> {
    return new Promise((resolve) => {
        let started = session.status === 'running';

        const finish = (outcome: RunOutcome): void => {
            clearTimeout(timer);
            session.removeEventListener('changed', onChange);
            signal.removeEventListener('abort', cancel);
            resolve(outcome);
        };

        const cancel = (): void => {
            session.cancel();
            finish('timeout');
        };

        const onChange = (): void => {
            if (session.status === 'running') {
                started = true;
            } else if (session.status === 'error') {
                finish('error');
            } else if (started && session.status === 'idle') {
                finish('idle');
            }
        };

        const timer = setTimeout(cancel, RUN_TIMEOUT_MS);
        session.addEventListener('changed', onChange);
        signal.addEventListener('abort', cancel);
        onChange();
    });
}

/**
 * Hands a question to Studio's own data agent instead of answering it from the browser agent's
 * side. The data agent knows the schema and writes its own queries; the browser agent gets back
 * its written answer and stays in control of the dashboard.
 */
export function createHandoffTool({ api, harness, log }: HandoffToolDeps): BridgedTool {
    const tool = api.defineAiTool({
        name: 'ask_studio_analyst',
        description:
            "Put a question about this dashboard's data to Studio's own data analyst agent, which " +
            'knows the schema and writes the queries itself. Use it for questions about what the ' +
            'data contains or shows, rather than querying field by field.',
        params: (s) => s.object({ question: s.string({ description: 'The question, in plain language.' }) }),
        execute: async ({ question }, ctx) => {
            log(`ask_studio_analyst: ${question}`);
            const session = await harness.createThread({ agentId: 'data', title: 'Asked via WebMCP' });
            try {
                session.sendMessage(question);
                const outcome = await runSettled(session, ctx.signal);
                const calls = toolCallNames(session);
                log(`analyst ${outcome}, tool calls: ${calls.join(', ') || 'none'}`);

                const answer = lastAssistantText(session);
                if (outcome === 'timeout') return ctx.error('The analyst did not finish in time and was cancelled.');
                if (outcome === 'error') return ctx.error(answer ?? 'The analyst run failed.');
                if (answer == null) return ctx.error('The analyst finished without an answer.');
                return ctx.success(answer, { toolCalls: calls });
            } finally {
                session.close();
            }
        },
    });

    // Not read-only: the data agent can create calculated fields while answering.
    return { tool, readOnly: false };
}
