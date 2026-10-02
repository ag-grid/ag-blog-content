import { useState, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { AgStudio } from 'ag-studio-react';
import type {
    AgReportState,
    AgStudioApi,
    AgStudioApiReadyEvent,
    AgStudioMode,
    AgStudioStateUpdatedEvent,
} from 'ag-studio';
import { enableStudioDevValidations } from 'ag-studio';
import { theme } from './theme.ts';

// Enable extended validations only for development
enableStudioDevValidations();

// If you have an AG Studio licence key, uncomment these two lines to remove the
// trial watermark. Request a free 45-day trial at:
//   https://ag-grid.com/studio/license-pricing/?tab=trial
// import { AgStudioLicenseManager } from 'ag-studio';
// AgStudioLicenseManager.setLicenseKey('YOUR_LICENSE_KEY');

import { data } from './data';
import initialStateJSON from './initial-state.json';
import devStateJSON from './dev-state.json';
import { clearState, loadState, saveState } from './storage';

// Open the app with `?dev` to show the report in dev-state.json instead. It is
// saved under its own key, so the main report and its tabs are left untouched.
const isDevView = new URLSearchParams(window.location.search).has('dev');
// The JSON imports widen literal types (e.g. widget `type`), so assert them
// back to the state shape Studio expects.
const startingState = (isDevView ? devStateJSON : initialStateJSON) as unknown as AgReportState;
const STORAGE_KEY = isDevView ? 'studio-playground.dev-state' : 'studio-playground.state';

// Each tab is a page in the Studio state. Pages have no name, so tabs are
// labelled by position unless given a name here.
const PAGE_LABELS: Record<string, string> = { 'page-2': 'Purchase Orders' };

const tabLabel = (pageId: string, index: number) => PAGE_LABELS[pageId] ?? `Report ${index + 1}`;

/** Returns the first `page-N` id not already used by a page in the state. */
function nextPageId(state: AgReportState): string {
    const ids = new Set(state.pages.map(({ id }) => id));
    let n = state.pages.length + 1;
    while (ids.has(`page-${n}`)) n++;
    return `page-${n}`;
}

// State must be updated immutably: Studio diffs by reference.
const withPageSelected = (state: AgReportState, pageId: string): AgReportState => ({
    ...state,
    selectedPageId: pageId,
});

const withNewPage = (state: AgReportState): AgReportState => {
    const pageId = nextPageId(state);
    return { ...state, pages: [...state.pages, { id: pageId }], selectedPageId: pageId };
};

const tabButtonStyle = (selected: boolean): CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: selected ? '2px solid #3A5C8A' : '2px solid transparent',
    background: 'none',
    font: 'inherit',
    fontWeight: selected ? 600 : 400,
    color: selected ? '#3A5C8A' : '#5E6A7A',
    cursor: 'pointer',
});

const addTabButtonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    border: 'none',
    borderRadius: '4px',
    background: 'none',
    color: '#5E6A7A',
    cursor: 'pointer',
};

const actionButtonStyle: CSSProperties = {
    padding: '4px 12px',
    border: '1px solid #D8DFE8',
    borderRadius: '4px',
    background: '#FFFFFF',
    font: 'inherit',
    color: '#3A5C8A',
    cursor: 'pointer',
};

export default function App() {
    // Read once, on mount: the saved state replaces the default when present.
    const [initialState] = useState(() => loadState(STORAGE_KEY) ?? startingState);
    // Mirrors the Studio state so the tab bar re-renders when pages change.
    const [state, setState] = useState(initialState);
    const [mode, setMode] = useState<AgStudioMode>('edit');

    // A single Studio instance holds every tab as a page of one report, so
    // switching or adding tabs goes through its API rather than remounting.
    const apiRef = useRef<AgStudioApi | null>(null);

    const applyState = useCallback((newState: AgReportState) => {
        apiRef.current?.setState(newState);
        setState(newState);
    }, []);

    const selectTab = (pageId: string) => applyState(withPageSelected(state, pageId));
    const addTab = () => applyState(withNewPage(state));
    const save = () => saveState(STORAGE_KEY, state);

    const reset = () => {
        clearState(STORAGE_KEY);
        applyState(startingState);
        apiRef.current?.clearHistory();
    };

    const toggleMode = () => setMode((prev) => (prev === 'edit' ? 'view' : 'edit'));

    const onApiReady = useCallback((event: AgStudioApiReadyEvent) => {
        apiRef.current = event.api;
    }, []);

    const onStateUpdated = useCallback((event: AgStudioStateUpdatedEvent) => {
        setState(event.state);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0 8px',
                    borderBottom: '1px solid #D8DFE8',
                }}
            >
                {state.pages.map(({ id }, index) => (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={state.selectedPageId === id}
                        onClick={() => selectTab(id)}
                        style={tabButtonStyle(state.selectedPageId === id)}
                    >
                        {tabLabel(id, index)}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={addTab}
                    title="New report"
                    aria-label="New report"
                    style={addTabButtonStyle}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                        <path
                            d="M8 3v10M3 8h10"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
                <button style={{ ...actionButtonStyle, marginLeft: 'auto' }} onClick={toggleMode}>
                    Toggle Edit Mode
                </button>
                <button style={actionButtonStyle} onClick={save}>
                    Save
                </button>
                <button style={actionButtonStyle} onClick={reset} title="Discard everything saved in this browser">
                    Reset
                </button>
            </div>

            {/* minHeight: 0 lets this flex child shrink so Studio sizes to the
                remaining space rather than overflowing the viewport. */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <AgStudio
                    theme={theme}
                    style={{ height: '100%', width: '100%' }}
                    data={data}
                    initialState={initialState}
                    mode={mode}
                    onApiReady={onApiReady}
                    onStateUpdated={onStateUpdated}
                />
            </div>
        </div>
    );
}
