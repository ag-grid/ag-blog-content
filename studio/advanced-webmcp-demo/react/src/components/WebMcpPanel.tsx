import type { WebMcpSnapshot } from '../studio/mountStudio.ts';

interface WebMcpPanelProps {
    snapshot: WebMcpSnapshot;
}

/** What a browser agent can currently see of the page. Read-only: the agent makes every change. */
export function WebMcpPanel({ snapshot }: WebMcpPanelProps) {
    const { supported, handoffEnabled, published, library, log, error } = snapshot;
    const publishedNames = new Set(published.map(({ name }) => name));
    const unpublished = library.filter(({ name }) => !publishedNames.has(name));

    return (
        <aside className="webmcp-panel">
            <h2>WebMCP</h2>
            {supported ? (
                <p className="status ok">document.modelContext found - tools are published to the browser.</p>
            ) : (
                <p className="status warn">
                    This browser has no WebMCP support, so nothing is published. Bookkeeping still runs.
                </p>
            )}
            {!handoffEnabled && <p className="status muted">AI_API_URL is not set, so ask_studio_analyst is off.</p>}
            {error && <p className="status error">{error}</p>}

            <h3>Published ({published.length})</h3>
            <ul className="tools">
                {published.map(({ name, registrations }) => (
                    <li key={name}>
                        {name}
                        {registrations > 1 && <span className="badge">×{registrations}</span>}
                    </li>
                ))}
            </ul>

            <h3>In the library ({unpublished.length})</h3>
            <ul className="tools muted">
                {unpublished.map(({ name }) => (
                    <li key={name}>{name}</li>
                ))}
            </ul>

            <h3>Call log</h3>
            {log.length === 0 ? (
                <p className="status muted">No calls yet.</p>
            ) : (
                <ol className="log">
                    {log.map(({ id, text, status, detail }) => (
                        <li key={id} className={status}>
                            {text}
                            {status === 'running' && <span className="log-detail">running…</span>}
                            {detail && <span className="log-detail">{detail}</span>}
                        </li>
                    ))}
                </ol>
            )}
        </aside>
    );
}
