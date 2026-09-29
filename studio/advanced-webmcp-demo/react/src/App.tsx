import { useEffect, useRef, useState } from 'react';

import './App.css';
import { WebMcpPanel } from './components/WebMcpPanel.tsx';
import type { WebMcpSnapshot } from './studioWebMcp.ts';
import { mountStudioWebMcp } from './studioWebMcp.ts';

function App() {
    const studioRef = useRef<HTMLDivElement>(null);
    const [snapshot, setSnapshot] = useState<WebMcpSnapshot>();

    useEffect(() => {
        const studio = mountStudioWebMcp(studioRef.current!);
        const unsubscribe = studio.subscribe(setSnapshot);
        setSnapshot(studio.getSnapshot());
        // StrictMode mounts twice in development, so tearing down fully here matters: a leftover
        // instance would keep its tools registered with the browser.
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

export default App;
