# AG Studio Playground

A minimal React + Vite + TypeScript app for learning [AG Studio](https://ag-grid.com/studio/) — an embedded analytics component (built on AG Grid + AG Charts) that gives you a drag-and-drop dashboard/report builder from a single component.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5173).

## What's here

- **`src/data.ts`** — the data you feed AG Studio: `{ sources: [{ id, data: [...] }] }`, where each source is a table of plain objects. Fields are inferred from the data.
- **`src/App.tsx`** — renders the `AgStudio` component inside a full-viewport container with `mode="edit"`.

## How to use AG Studio

1. The app opens in **edit** mode — the drag-and-drop report builder.
2. Drag fields from the left panel onto the canvas to create widgets (charts, grids, KPI tiles).
3. Bar/line/pie charts, grids and value tiles all come built in.
4. Switch `mode="edit"` to `mode="view"` in `src/App.tsx` to lock the layout while keeping it interactive (cross-filtering etc.).

## Licence

AG Studio is a **commercial** product. Without a licence key it runs in trial mode with a watermark, which is fine for learning. To remove the watermark, request a free 45-day trial at
<https://ag-grid.com/studio/license-pricing/?tab=trial> and uncomment the `AgStudioLicenseManager.setLicenseKey(...)` lines in `src/App.tsx`.

## Docs

- Overview & quick start: <https://ag-grid.com/studio/react/overview/>
- Tutorial: <https://ag-grid.com/studio/react/tutorial/>
- Live demo: <https://ag-grid.com/studio/example/>
