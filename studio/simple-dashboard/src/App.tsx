import { useState, useMemo, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { AgStudio } from 'ag-studio-react';
import type {
    AgReportState,
    AgStudioApi,
    AgStudioApiReadyEvent,
    AgStudioMode,
    AgStudioStateUpdatedEvent,
} from 'ag-studio';
import { enableStudioDevValidations } from "ag-studio";
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
import { clearWorkspace, loadWorkspace, saveWorkspace } from './storage';

type Tab = { id: string; label: string };

// The JSON import widens literal types (e.g. widget `type`), so assert it back
// to the state shape Studio expects.
const defaultReportState = initialStateJSON as unknown as AgReportState;

// Each tab is a page in the Studio state, so the default tab's id is the id
// of the page in the bundled report.
const DEFAULT_TAB_ID = defaultReportState.selectedPageId;
const DEFAULT_TABS: Tab[] = [{ id: DEFAULT_TAB_ID, label: 'Purchase Orders' }];

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

export default function App() {
    // Read once, on mount: the saved tabs and state replace the defaults when
    // the user has saved before.
    const [saved] = useState(loadWorkspace);
    const initialState = saved?.state ?? defaultReportState;

    const [tabs, setTabs] = useState<Tab[]>(() => saved?.tabs ?? DEFAULT_TABS);
    // Mirrors `selectedPageId` in the Studio state, which is the source of truth.
    const [tab, setTab] = useState<string>(initialState.selectedPageId);
    const [mode, setMode] = useState<AgStudioMode>('edit');
    const [dirty, setDirty] = useState(false);

    // A single Studio instance holds every tab as a page of one report, so
    // switching or adding tabs goes through its API rather than remounting.
    const apiRef = useRef<AgStudioApi | null>(null);
    const stateRef = useRef<AgReportState>(initialState);
    const nextTabNumber = useRef((saved?.tabs ?? DEFAULT_TABS).length);

    const activeTab = useMemo(() => tabs.find(({ id }) => id === tab) ?? tabs[0], [tabs, tab]);

    const toggleMode = useCallback(() => {
        setMode((prev) => (prev === 'edit' ? 'view' : 'edit'));
    }, []);

    const selectTab = useCallback((id: string) => {
        const api = apiRef.current;
        if (!api) return;
        api.setState({ ...api.getState(), selectedPageId: id });
        setTab(id);
    }, []);

    const addTab = useCallback(() => {
        const api = apiRef.current;
        if (!api) return;

        const n = ++nextTabNumber.current;
        const newTab: Tab = { id: `page-${n}`, label: `Report ${n}` };
        const state = api.getState();
        // State must be updated immutably: Studio diffs by reference.
        api.setState({
            ...state,
            pages: [...state.pages, { id: newTab.id }],
            selectedPageId: newTab.id,
        });
        setTabs((prev) => [...prev, newTab]);
        setTab(newTab.id);
        setDirty(true);
    }, []);

    const onApiReady = useCallback((event: AgStudioApiReadyEvent) => {
        apiRef.current = event.api;
    }, []);

    const onStateUpdated = useCallback((event: AgStudioStateUpdatedEvent) => {
        stateRef.current = event.state;
        setTab(event.state.selectedPageId);
        setDirty(true);
        console.log(event.state);
    }, []);

    const save = useCallback(() => {
        if (saveWorkspace({ tabs, state: stateRef.current })) setDirty(false);
    }, [tabs]);

    const reset = useCallback(() => {
        clearWorkspace();
        apiRef.current?.setState(defaultReportState);
        apiRef.current?.clearHistory();
        stateRef.current = defaultReportState;
        nextTabNumber.current = DEFAULT_TABS.length;
        setTabs(DEFAULT_TABS);
        setTab(DEFAULT_TAB_ID);
        setDirty(false);
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
                {tabs.map(({ id, label }) => (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={activeTab.id === id}
                        onClick={() => selectTab(id)}
                        style={tabButtonStyle(activeTab.id === id)}
                    >
                        {label}
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
                <button style={{ marginLeft: 'auto' }} onClick={toggleMode}>
                    Toggle Edit Mode
                </button>
                <button onClick={save} disabled={!dirty}>
                    {dirty ? 'Save' : 'Saved'}
                </button>
                <button onClick={reset} title="Discard everything saved in this browser">
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
                    onStudioReady={() => console.log('AG Studio is ready')}
                    onStateUpdated={onStateUpdated}
                />
            </div>
        </div>
    );
}
