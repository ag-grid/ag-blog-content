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
  public inputRow: Partial<AthleteData> = {};
  public pinnedTopRowData: Partial<AthleteData>[] = [{}];
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

  public onCellEditingStopped(params: CellEditingStoppedEvent): void {
    if (params.rowPinned !== 'top') return;

    const field = params.colDef.field as keyof AthleteData;
    this.inputRow = { ...this.inputRow, [field]: params.newValue };

    // Update the pinned row data to reflect the changes
    this.pinnedTopRowData = [this.inputRow];

    // Check if all fields are filled
    const requiredFields: (keyof AthleteData)[] = [
      'athlete',
      'sport',
      'date',
      'age',
    ];
    const isComplete = requiredFields.every((fieldName) => {
      const value = this.inputRow[fieldName];
      return value !== undefined && value !== null && value !== '';
    });

    if (isComplete) {
      // Add new row to data
      const newRow = this.inputRow as AthleteData;
      this.rowData = [...this.rowData, newRow];

      // Flash the newly added row
      setTimeout(() => {
        this.gridApi.forEachNode((node: any) => {
          if (node.data === newRow) {
            this.gridApi.flashCells({ rowNodes: [node] });
          }
        });
      }, 100);

      // Reset input row
      this.inputRow = {};
      this.pinnedTopRowData = [this.inputRow];
    }
  }

  public rowNumbersFormatter = (params: ValueFormatterParams): string => {
    return params?.node?.rowPinned ? '' : params?.value;
  };
}
