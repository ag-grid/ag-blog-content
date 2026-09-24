import type { AgReportState } from 'ag-studio';

// Reports are persisted to localStorage so a browser refresh restores the
// tabs the user had open along with each tab's Studio state.
const STORAGE_KEY = 'studio-playground.workspace';

export type SavedTab = { id: string; label: string };

export type SavedWorkspace = {
    tabs: SavedTab[];
    /** Latest Studio state per tab id. */
    states: Record<string, AgReportState>;
};

export function loadWorkspace(): SavedWorkspace | undefined {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return undefined;

        const parsed = JSON.parse(raw) as Partial<SavedWorkspace>;
        if (!Array.isArray(parsed.tabs) || parsed.tabs.length === 0) return undefined;

        return { tabs: parsed.tabs, states: parsed.states ?? {} };
    } catch (error) {
        // Corrupt or unreadable storage (e.g. a private-mode browser) should
        // never stop the app loading — fall back to the default report.
        console.warn('Could not read the saved workspace:', error);
        return undefined;
    }
}

export function saveWorkspace(workspace: SavedWorkspace): boolean {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
        return true;
    } catch (error) {
        console.warn('Could not save the workspace:', error);
        return false;
    }
}

export function clearWorkspace(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('Could not clear the saved workspace:', error);
    }
}
