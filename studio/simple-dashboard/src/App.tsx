import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { AgStudio } from 'ag-studio-react';
import type { AgReportState, AgStudioMode, AgStudioStateUpdatedEvent } from 'ag-studio';
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

const DEFAULT_TAB_ID = 'orders';
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

// The JSON import widens literal types (e.g. widget `type`), so assert it back
// to the state shape Studio expects.
const defaultReportState = initialStateJSON as unknown as AgReportState;

export default function App() {
    // Read once, on mount: the saved tabs and their states replace the
    // defaults when the user has saved before.
    const [saved] = useState(loadWorkspace);

    const [tabs, setTabs] = useState<Tab[]>(() => saved?.tabs ?? DEFAULT_TABS);
    const [tab, setTab] = useState<string>(() => (saved?.tabs ?? DEFAULT_TABS)[0].id);
    const [mode, setMode] = useState<AgStudioMode>('edit');
    const [dirty, setDirty] = useState(false);
    // Bumped on reset so the mounted instance remounts even when the active
    // tab id has not changed.
    const [generation, setGeneration] = useState(0);

    // Latest state per tab, kept in a ref because only the active tab is
    // mounted — this is what lets a tab come back as the user left it, and
    // it is what gets written to localStorage on save.
    const statesRef = useRef<Record<string, AgReportState>>(saved?.states ?? {});
    const nextTabNumber = useRef((saved?.tabs ?? DEFAULT_TABS).length);

    const activeTab = useMemo(() => tabs.find(({ id }) => id === tab) ?? tabs[0], [tabs, tab]);

    // `onStateUpdated` fires from the mounted instance, so it needs the tab id
    // that was current at the time rather than the one captured at creation.
    const activeTabIdRef = useRef(activeTab.id);
    useEffect(() => {
        activeTabIdRef.current = activeTab.id;
    }, [activeTab.id]);

    const toggleMode = useCallback(() => {
        setMode((prev) => (prev === 'edit' ? 'view' : 'edit'));
    }, []);

    const addTab = useCallback(() => {
        const n = ++nextTabNumber.current;
        const newTab: Tab = { id: `report-${n}`, label: `Report ${n}` };
        setTabs((prev) => [...prev, newTab]);
        setTab(newTab.id);
        setDirty(true);
    }, []);

    const onStateUpdated = useCallback((event: AgStudioStateUpdatedEvent) => {
        statesRef.current[activeTabIdRef.current] = event.state;
        setDirty(true);
    }, []);

    const save = useCallback(() => {
        // Drop states belonging to tabs that no longer exist.
        const states: Record<string, AgReportState> = {};
        for (const { id } of tabs) {
            const state = statesRef.current[id];
            if (state) states[id] = state;
        }
        statesRef.current = states;

        if (saveWorkspace({ tabs, states })) setDirty(false);
    }, [tabs]);

    const reset = useCallback(() => {
        clearWorkspace();
        statesRef.current = {};
        nextTabNumber.current = DEFAULT_TABS.length;
        setTabs(DEFAULT_TABS);
        setTab(DEFAULT_TAB_ID);
        setGeneration((prev) => prev + 1);
        setDirty(false);
    }, []);

    // A saved state always wins; otherwise the first tab opens the bundled
    // report and tabs added with "+" open empty.
    const initialState =
        statesRef.current[activeTab.id] ??
        (activeTab.id === DEFAULT_TAB_ID ? defaultReportState : undefined);

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
                        onClick={() => setTab(id)}
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
                {/* The key keeps each tab a separate Studio instance; without
                    it React reuses one instance and swapping `data` or
                    `initialState` is rejected as a reactive update. */}
                <AgStudio
                    key={`${activeTab.id}:${generation}`}
                    theme={theme}
                    style={{ height: '100%', width: '100%' }}
                    data={data}
                    initialState={initialState}
                    mode={mode}
                    onStudioReady={() => console.log(`AG Studio (${activeTab.id}) is ready`)}
                    onStateUpdated={onStateUpdated}
                />
            </div>
        </div>
    );
}
