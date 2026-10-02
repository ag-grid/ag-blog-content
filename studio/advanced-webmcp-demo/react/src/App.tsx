import { useEffect, useRef, useState } from 'react';

import './App.css';
import { WebMcpPanel } from './components/WebMcpPanel.tsx';
import type { WebMcpSnapshot } from './studio/mountStudio.ts';
import { mountStudio } from './studio/mountStudio.ts';

export default function App() {
    const studioRef = useRef<HTMLDivElement>(null);
    const [snapshot, setSnapshot] = useState<WebMcpSnapshot>();

    useEffect(() => {
        const studio = mountStudio(studioRef.current!);
        setSnapshot(studio.getSnapshot());
        const unsubscribe = studio.subscribe(setSnapshot);
        // Tear down fully: a leftover instance would keep its tools registered with the browser.
        return () => {
            unsubscribe();
            studio.destroy();
        };
    }, []);

    return (
        <div className="app">
            <div ref={studioRef} className="studio" />
            {snapshot && <WebMcpPanel snapshot={snapshot} />}
        </div>
    );
}
