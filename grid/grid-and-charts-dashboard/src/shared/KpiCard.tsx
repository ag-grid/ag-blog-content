interface KpiCardProps {
    label: string;
    value: string;
    /** How the value is calculated. */
    caption: string;
    /** Optional hover text, e.g. the exact figure behind a rounded value. */
    title?: string;
}

export function KpiCard({ label, value, caption, title }: KpiCardProps) {
    return (
        <section className="card kpi-card">
            <header className="kpi-header">
                <h2 className="kpi-label">{label}</h2>
                <p className="hint">{caption}</p>
            </header>
            <p className="kpi-value" title={title}>
                {value}
            </p>
        </section>
    );
}
