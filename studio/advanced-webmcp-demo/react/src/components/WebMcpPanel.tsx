import type { WebMcpSnapshot } from '../studioWebMcp.ts';

/**
 * What a browser agent can currently see of the page. Read-only: every change here is made by the
 * agent calling tools, which is the point of the demo.
 */
export function WebMcpPanel({ snapshot }: { snapshot: WebMcpSnapshot }) {
    const { supported, handoffConfigured, advertised, catalogue, callLog, lastError } = snapshot;
    const advertisedNames = new Set(advertised.map(({ name }) => name));
    const available = catalogue.filter(({ name }) => !advertisedNames.has(name));

    return (
        <aside className="webmcp-panel">
            <h2>WebMCP</h2>
            <p className={supported ? 'status ok' : 'status warn'}>
                {supported
                    ? 'document.modelContext found - tools are published to the browser.'
                    : 'This browser has no WebMCP support, so nothing is published. Bookkeeping still runs.'}
            </p>
            {!handoffConfigured && <p className="status muted">No AI endpoint set, so ask_studio_analyst is off.</p>}
            {lastError && <p className="status error">{lastError}</p>}

            <h3>Published ({advertised.length})</h3>
            <ul className="tools">
                {advertised.map(({ name, registrations }) => (
                    <li key={name}>
                        {name}
                        {registrations > 1 && <span className="badge">×{registrations}</span>}
                    </li>
                ))}
            </ul>

            <h3>In the library ({available.length})</h3>
            <ul className="tools muted">
                {available.map(({ name }) => (
                    <li key={name}>{name}</li>
                ))}
            </ul>

            <h3>Call log</h3>
            {callLog.length === 0 ? (
                <p className="status muted">No calls yet.</p>
            ) : (
                <ol className="log">
                    {callLog.map((line, i) => (
                        <li key={i}>{line}</li>
                    ))}
                </ol>
            )}
        </aside>
    );
}
