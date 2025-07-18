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
  public pinnedRowData: Partial<AthleteData> = {};
  public columnDefs: ColDef<AthleteData>[] = [];
  public defaultColDef: ColDef = {};

  private gridApi!: GridApi;

  ngOnInit(): void {
    this.setupGrid();
  }

  private setupGrid(): void {
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
        cellEditor: 'agDateCellEditor',
        valueFormatter: this.valueFormatter.bind(this),
      },
      {
        field: 'age',
        headerName: 'Age',
        valueFormatter: this.valueFormatter.bind(this),
      },
    ];

    this.defaultColDef = {
      flex: 1,
      editable: true,
      valueFormatter: this.valueFormatter.bind(this),
      cellClassRules: {
        'pinned-cell-editing': (params: any) =>
          params.node.rowPinned && params.value,
      },
    };
  }

  public onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const response = await fetch(
        'https://www.ag-grid.com/example-assets/olympic-winners.json'
      );
      const data = await response.json();

      const sampleData = data.slice(3, 6).map((item: any) => ({
        ...item,
        date: parseDate(item.date),
      }));

      this.rowData = sampleData;
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  private isEmptyPinnedCell(params: ValueFormatterParams): boolean {
    return (
      params?.node?.rowPinned === 'top' &&
      (params.value == null || params.value === '')
    );
  }

  private valueFormatter(params: ValueFormatterParams): string {
    if (this.isEmptyPinnedCell(params)) {
      return `${params.colDef.headerName}...`;
    }

    if (params.colDef.field === 'date') {
      return formatDate(params.value);
    }

    return params.value;
  }

  // Check all pinned row cells have a value
  isPinnedRowDataComplete = () => {
    return this.columnDefs.every((colDef) => {
      if (!colDef.field) return false;

      const v = this.pinnedRowData[colDef.field!];
      return v != null && v !== '';
    });
  };

  public onCellEditingStopped(params: CellEditingStoppedEvent): void {
    // Only handle pinned row edits
    if (params.rowPinned !== 'top') return;

    // Check all pinned row cells have values
    if (!this.isPinnedRowDataComplete()) return;

    // Add new row to data
    const transaction = this.gridApi.applyTransaction({
      add: [this.pinnedRowData],
    });

    // Reset input row
    this.pinnedRowData = {};
    this.gridApi.setGridOption('pinnedTopRowData', [this.pinnedRowData]);

    // Flash the newly added row to draw attention
    // Note: add delay to ensure transaction & updates complete
    setTimeout(() => {
      this.gridApi.flashCells({
        rowNodes: transaction?.add,
      });
    }, 100);
  }

  public rowNumbersFormatter = (params: ValueFormatterParams): string => {
    return params?.node?.rowPinned ? '' : params?.value;
  };
}
