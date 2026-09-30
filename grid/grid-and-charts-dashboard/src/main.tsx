import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { enableDevValidations, ModuleRegistry as GridModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import {
    AllCommunityModule as AllChartsCommunityModule,
    ModuleRegistry as ChartsModuleRegistry,
} from 'ag-charts-community';
import { StageNav, type Stage } from './StageNav';
import { App as Stage1 } from './stages/stage1-independent/App';
import { App as Stage2 } from './stages/stage2-date-filter/App';
import { App as Stage3 } from './stages/stage3-grid-filters/App';
import { App as Stage4 } from './stages/stage4-chart-filter/App';
import './index.css';
import './App.css';

// TODO: replace the all-in-one bundles with the specific modules used, to reduce bundle size.
GridModuleRegistry.registerModules([AllEnterpriseModule]);
ChartsModuleRegistry.registerModules([AllChartsCommunityModule]);

if (import.meta.env.DEV) {
    enableDevValidations();
}

// Enterprise licence: set VITE_AG_LICENSE_KEY and call LicenseManager.setLicenseKey from 'ag-grid-enterprise'.

// Each stage builds on the one before. Stage 4 is the complete dashboard.
const stages: Stage[] = [
    { id: 1, label: 'Independent widgets', App: Stage1 },
    { id: 2, label: 'Date filter', App: Stage2 },
    { id: 3, label: 'Grid filters chart & KPIs', App: Stage3 },
    { id: 4, label: 'Chart filters grid & KPIs', App: Stage4 },
];

// Pick the stage from the URL, e.g. ?stage=2. With no stage given, show the complete dashboard.
const requested = Number(new URLSearchParams(window.location.search).get('stage'));
const current = stages.find((stage) => stage.id === requested) ?? stages[stages.length - 1];
const CurrentApp = current.App;

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <StageNav stages={stages} currentId={current.id} />
        <CurrentApp />
    </StrictMode>,
);
