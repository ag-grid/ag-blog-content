# AG Grid & AG Charts Procurement Dashboard Demo

This demo showcases how to build a procurement spend dashboard by hand with AG Grid and AG Charts in React, including cross-filtering between the grid, the chart and the KPIs.

Want to see the same dashboard built with AG Studio? Take a look at the [AG Studio version](../../studio/simple-dashboard/react/).

## Full Tutorial

[Grids + Charts != Dashboards](https://www.ag-grid.com/blog/grids-charts-dashboards/)

## Features

- **KPI Cards**: Total purchase orders and total spend, kept in step with every filter on the page
- **Date Range Filter**: Start and end date inputs that filter every widget
- **Spend Chart**: AG Charts bar chart showing total spend per month
- **Grouped Orders Grid**: Purchase orders grouped by material, then supplier, with summed quantity and spend and average unit cost
- **Grid to Chart Filtering**: Column filters in the grid also filter the chart and KPIs
- **Chart to Grid Filtering**: Clicking a bar filters the grid and KPIs to that month and dims the other bars
- **Active Filter Chips**: Shows what's filtering the page, with a chip to clear each filter and a button to reset them all

## Build Stages

The demo is split into four stages, each building on the one before. Switch between them using the tabs at the top of the page, or by adding `?stage=` to the URL (e.g. `?stage=2`). With no stage set, the finished dashboard (stage 4) is shown.

1. **Independent Widgets** (`stage1-independent`) - The grid, chart and KPIs side by side, with no shared filtering
2. **Date Filter** (`stage2-date-filter`) - Adds a date range filter that every widget reads from
3. **Grid Filters Chart & KPIs** (`stage3-grid-filters`) - The grid's column filters now filter the chart and KPIs too
4. **Chart Filters Grid & KPIs** (`stage4-chart-filter`) - Clicking a bar filters the grid and KPIs by month, plus filter chips and a reset button

## Running the Demo

```bash
npm install
npm run dev
```

## Project Structure

```
src/
├── data/                       # Purchase order, material and supplier JSON
├── shared/
│   ├── DateRangeFilter.tsx     # Start and end date inputs
│   ├── KpiCard.tsx             # KPI card
│   └── format.ts               # Number, currency and date formatting
├── stages/
│   ├── stage1-independent/     # Each stage has its own App, OrdersGrid, SpendChart and data.ts
│   ├── stage2-date-filter/
│   ├── stage3-grid-filters/
│   └── stage4-chart-filter/
├── StageNav.tsx                # Top bar linking to each stage
├── App.css                     # Dashboard styling
├── index.css                   # Global styles
└── main.tsx                    # Registers the AG Grid and AG Charts modules and picks the stage from the URL
```

## Key Implementation Details

### Data Processing

All of a stage's data processing lives in its `data.ts`. It joins the raw orders with the material and supplier names, works out the spend for each order, and exposes one function per widget (`getGridRows`, `getChartData` and `getKpis`). The components only display what these functions return.

### Filter State

Every filter is held in state in the stage's `App.tsx`, above the widgets, so each widget can react to every filter. Each widget's data is recalculated with `useMemo`, and its dependency list shows which filters reach that widget.

### Applying Grid Filters Outside the Grid

The grid applies its own column filters, but the chart and KPIs need them too. From stage 3, the grid passes its filter model up to `App.tsx` and `passesGridFilters` in `data.ts` applies the same rules to each order. If you change the column filters in `OrdersGrid.tsx`, keep `passesGridFilters` in step.

## Key Technologies

- **AG Grid Enterprise**: Row grouping, aggregation and Set Filters
- **AG Charts**: Bar chart
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server

## Learn More

- [AG Grid Documentation](https://www.ag-grid.com/react-data-grid/getting-started/) - learn about AG Grid features and API
- [AG Charts Documentation](https://www.ag-grid.com/charts/react/quick-start/) - learn about AG Charts features and API
- [Row Grouping](https://www.ag-grid.com/react-data-grid/grouping/) - detailed guide on row grouping
- [Filter API](https://www.ag-grid.com/react-data-grid/filter-api/) - reading and setting the grid's filters

## License

This demo uses AG Grid Enterprise features. Without a license key it runs with a watermark, which is fine for trying it out. To add a key, call `LicenseManager.setLicenseKey` from `ag-grid-enterprise` in `src/main.tsx`. Please refer to the [AG Grid license](https://www.ag-grid.com/license) for usage terms.
