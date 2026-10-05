# AG Studio Procurement Dashboard Demo

This demo showcases how to build a procurement spend dashboard with AG Studio in React. Instead of writing the widgets, filtering and layout yourself, you give AG Studio your data and a starting report, and users can change the dashboard themselves in the browser.

Want to see the same dashboard built by hand? Take a look at the [AG Grid & AG Charts version](../../../grid/grid-and-charts-dashboard/).

## Full Tutorial

[Grids + Charts != Dashboards](https://www.ag-grid.com/blog/grids-charts-dashboards/)

## Features

- **Spend Overview Report**: A ready-made report with KPI tiles (total purchase orders, total spend and % units accepted), a material category filter, a spend by supplier donut chart, a monthly spend chart stacked by material, and a pivot grid of materials and suppliers
- **Built-in Filtering**: The category filter filters the rest of the page, with no filtering code to write
- **Edit and View Modes**: Toggle between the drag-and-drop report builder and a locked, interactive view
- **Related Data Sources**: Purchase orders, suppliers and materials are joined through relationships, so fields from all three can be used in one widget
- **Calculated Fields**: Spend, days late, on-time delivery and units accepted are expressions saved in the report
- **Multiple Reports**: Each tab is a page in the report, and the **+** button adds a new one
- **Save and Reset**: Save stores the report in localStorage, so a refresh restores every tab. Reset discards it and goes back to the starting report
- **Custom Theme**: Fonts, colours and chart palette set with `studioTheme.withParams`

## Dev Report

Add `?dev` to the URL (e.g. `http://localhost:5173/?dev`) to load the report in `dev-state.json` instead. It swaps the category filter for a date filter, and shows the KPI tiles, the monthly spend chart and the pivot grid. It's saved under its own localStorage key, so the main report and its tabs are left untouched.

## Running the Demo

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── data/                   # Purchase order, supplier and material JSON
├── App.tsx                 # AG Studio, tab bar, mode toggle, save and reset
├── data.ts                 # Data sources and the relationships between them
├── initial-state.json      # The starting report
├── dev-state.json          # The report loaded with ?dev
├── storage.ts              # Saves and loads the report in localStorage
├── theme.ts                # AG Studio theme
├── index.css               # Full-viewport layout
└── main.tsx                # Entry point
```

## Key Implementation Details

### Data Sources

`data.ts` passes AG Studio a list of sources, each an array of plain objects. Fields are inferred from the data. The `relationships` link each purchase order to its supplier and material, which is what lets a single widget use fields from more than one source.

### Report State

The layout, widgets, filters and calculated fields all live in the report state, which is passed to AG Studio as `initialState`. To change the starting report, edit it in the browser, click **Save**, then copy the `studio-playground.state` value from localStorage into `initial-state.json`.

### Tabs

The tabs all share one AG Studio instance. Each tab is a page in the report state, so adding or switching tabs updates the state through the API with `setState`, rather than mounting a new AG Studio. The state must be updated immutably, as AG Studio compares it by reference. Tabs are labelled `Report 1`, `Report 2` and so on, unless given a name in `PAGE_LABELS` in `App.tsx`.

## Key Technologies

- **AG Studio React**: Embedded dashboard and report builder, built on AG Grid and AG Charts
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

## Learn More

- [AG Studio Overview](https://ag-grid.com/studio/react/overview/) - overview and quick start
- [AG Studio Tutorial](https://ag-grid.com/studio/react/tutorial/) - step-by-step tutorial
- [AG Studio Live Demo](https://ag-grid.com/studio/example/) - try AG Studio in the browser

## License

AG Studio is a commercial product. Without a license key it runs in trial mode with a watermark, which is fine for trying it out. To remove the watermark, request a [free 45-day trial](https://ag-grid.com/studio/license-pricing/?tab=trial) and uncomment the `AgStudioLicenseManager.setLicenseKey(...)` lines in `src/App.tsx`.
