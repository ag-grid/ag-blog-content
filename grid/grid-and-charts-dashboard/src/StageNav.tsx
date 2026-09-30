import type { ComponentType } from 'react';

export interface Stage {
    id: number;
    label: string;
    App: ComponentType;
}

interface StageNavProps {
    stages: Stage[];
    currentId: number;
}

/** The top bar: links to each build stage of the demo. */
export function StageNav({ stages, currentId }: StageNavProps) {
    return (
        <nav className="navbar" aria-label="Build stages">
            <span className="navbar-title">AG Grid &amp; Charts Dashboard</span>
            <ol className="stage-tabs">
                {stages.map((stage) => (
                    <li key={stage.id}>
                        <a href={`?stage=${stage.id}`} aria-current={stage.id === currentId ? 'page' : undefined}>
                            <b>{stage.id}</b> {stage.label}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
