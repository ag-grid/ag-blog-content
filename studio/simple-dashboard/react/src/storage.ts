import type { AgReportState } from 'ag-studio';

// The Studio state is persisted to localStorage so a browser refresh restores
// every page (tab) the user had open.

export function loadState(key: string): AgReportState | undefined {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : undefined;
    } catch {
        // Corrupt or unreadable storage should never stop the app loading.
        return undefined;
    }
}

export function saveState(key: string, state: AgReportState): void {
    localStorage.setItem(key, JSON.stringify(state));
}

export function clearState(key: string): void {
    localStorage.removeItem(key);
}
