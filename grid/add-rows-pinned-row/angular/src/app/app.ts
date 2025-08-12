/**
 * AG Grid Add Rows with Pinned Row Demo
 *
 * This demo shows how to implement a data entry form using AG Grid's
 * pinned row feature. Users can add new rows by filling in the top row.
 */

import { Component, OnInit } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  CellEditingStoppedEvent,
  ValueFormatterParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { SportRenderer } from './components/sport-renderer.component';
import { formatDate, parseDate } from './utils/date-utils';

// Register AG Grid modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

interface AthleteData {
  athlete: string;
  sport: string;
  date: Date;
  age: number;
}

@Component({
  selector: 'app',
  imports: [AgGridAngular],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
})
export class App implements OnInit {
  public rowData: AthleteData[] = [];
  // Store Data Entered Into Pinned Row Cells (Auto updated by Grid)
  public pinnedRowData: Partial<AthleteData> = {};
  public columnDefs: ColDef<AthleteData>[] = [];
  public defaultColDef: ColDef = {};

  // Store reference to Grid API for use throughout the demo
  private gridApi!: GridApi;

  ngOnInit(): void {
    this.setupGrid();
  }

  private setupGrid(): void {
    // Column definitions - specify fields, editors, and renderers
    this.columnDefs = [
      {
        field: 'athlete',
        headerName: 'Athlete',
      },
      {
        field: 'sport',
        headerName: 'Sport',
        cellRenderer: SportRenderer,
        cellEditor: 'agRichSelectCellEditor',
        cellEditorParams: {
          values: ['Swimming', 'Gymnastics', 'Cycling', 'Ski Jumping'],
          cellRenderer: SportRenderer,
        },
      },
      {
        field: 'date',
        headerName: 'Date',
        cellDataType: 'date',
        cellEditor: 'agDateCellEditor', // Built-in Date Cell Editor
        valueFormatter: this.valueFormatter.bind(this), // Required, to override cellEditor formatter
      },
      {
        field: 'age',
        headerName: 'Age',
        valueFormatter: this.valueFormatter.bind(this), // Required, to override cellEditor formatter
      },
    ];

    // Default column properties applied to all columns
    this.defaultColDef = {
      flex: 1,
      editable: (params) => params.node.rowPinned === 'top', // Only allow editing for pinned rows
      valueFormatter: this.valueFormatter.bind(this),
      cellClassRules: {
        // Apply CSS Class to Pinned Cells with User Edits
        'pinned-cell-editing': (params: any) =>
          params.node.rowPinned && params.value,
      },
    };
  }

  // Called when the grid is ready - initialize API and load data
  public onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.loadData();
  }

  // Fetches and processes data from the demo API
  private async loadData(): Promise<void> {
    try {
      // Fetch & Parse Data
      const response = await fetch(
        'https://www.ag-grid.com/example-assets/olympic-winners.json'
      );
      const data = await response.json();

      // Take a small sample and convert date strings to Date objects
      const sampleData = data.slice(3, 6).map((item: any) => ({
        ...item,
        date: parseDate(item.date),
      }));

      // Set Row Data
      this.rowData = sampleData;
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  // Checks if a cell in the pinned row is empty
  private isEmptyPinnedCell(params: ValueFormatterParams): boolean {
    return (
      params?.node?.rowPinned === 'top' &&
      (params.value == null || params.value === '')
    );
  }

  // Custom value formatter that handles both placeholders and data display
  private valueFormatter(params: ValueFormatterParams): string {
    // Show placeholder for empty pinned cells
    if (this.isEmptyPinnedCell(params)) {
      return `${params.colDef.headerName}...`;
    }

    // Format dates for display
    if (params.colDef.field === 'date') {
      return formatDate(params.value);
    }

    // Return plain value for all other cells
    return params.value;
  }

  // Checks if all required fields in the pinned row are filled
  isPinnedRowDataComplete = () => {
    return this.columnDefs.every((colDef) => {
      if (!colDef.field) return false;

      const v = this.pinnedRowData[colDef.field!];
      return v != null && v !== '';
    });
  };

  // Handles cell editing completion - adds new row when input is complete
  public onCellEditingStopped(params: CellEditingStoppedEvent): void {
    // Only process pinned row edits
    if (params.rowPinned !== 'top') return;

    // Check all pinned row cells have a value
    if (!this.isPinnedRowDataComplete()) return;

    // Add the new row to the grid data
    const transaction = this.gridApi.applyTransaction({
      add: [this.pinnedRowData],
    });

    // Reset the input row for next entry
    this.pinnedRowData = {};
    this.gridApi.setGridOption('pinnedTopRowData', [this.pinnedRowData]);

    // Flash the newly added row to draw attention
    this.gridApi.flashCells({
      rowNodes: transaction?.add,
    });
  }

  // Show row numbers for non-pinned rows
  public rowNumbersFormatter = (params: ValueFormatterParams): string => {
    return params?.node?.rowPinned ? '' : params?.value;
  };
}
