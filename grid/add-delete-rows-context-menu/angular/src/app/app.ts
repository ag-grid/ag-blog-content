import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GetContextMenuItemsParams,
  GridApi,
  GridReadyEvent,
  MenuItemDef,
  ModuleRegistry,
  DefaultMenuItem,
} from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { IOlympicData, ICellSelectionBounds, AddRowPosition } from './types';

ModuleRegistry.registerModules([AllEnterpriseModule]);

@Component({
  selector: 'app-root',
  imports: [AgGridAngular],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private http = inject(HttpClient);
  private gridApi!: GridApi;

  protected readonly rowData = signal<IOlympicData[]>([]);

  protected readonly columnDefs: ColDef[] = [
    { field: 'athlete', minWidth: 200 },
    { field: 'age' },
    { field: 'country', minWidth: 200 },
    { field: 'year' },
    { field: 'date', minWidth: 180 },
    { field: 'sport', minWidth: 200 },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
  ];

  protected readonly defaultColDef: ColDef = {
    flex: 1,
    minWidth: 100,
    editable: true,
    resizable: true,
  };

  ngOnInit() {
    this.fetchData();
  }

  private async fetchData() {
    try {
      const response = await firstValueFrom(
        this.http.get<IOlympicData[]>(
          'https://www.ag-grid.com/example-assets/olympic-winners.json'
        )
      );
      this.rowData.set(response || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  protected onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  private getCellSelectionBounds(): ICellSelectionBounds | undefined {
    try {
      const cellRanges = this.gridApi.getCellRanges();
      if (!cellRanges || cellRanges.length === 0) throw 'No cells selected!';
      if (!cellRanges[0].startRow || !cellRanges[0].endRow)
        throw 'Could not find selected Cell Range';

      const cellRangeStartRowIndex = cellRanges[0].startRow.rowIndex;
      const cellRangeEndRowIndex = cellRanges[0].endRow.rowIndex;
      const rowCount =
        Math.abs(cellRangeEndRowIndex - cellRangeStartRowIndex) + 1;

      return { cellRangeStartRowIndex, cellRangeEndRowIndex, rowCount };
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }

  private addRows(
    position: AddRowPosition,
    cellSelectionBounds: ICellSelectionBounds
  ) {
    try {
      const { cellRangeStartRowIndex, cellRangeEndRowIndex } =
        cellSelectionBounds;
      const newRows = Array(cellSelectionBounds.rowCount)
        .fill(null)
        .map(() => ({}));

      const insertIndex =
        position === 'above'
          ? Math.min(cellRangeStartRowIndex, cellRangeEndRowIndex)
          : Math.max(cellRangeStartRowIndex, cellRangeEndRowIndex) + 1;

      const result = this.gridApi.applyTransaction({
        add: newRows,
        addIndex: insertIndex,
      });

      if (result && result.add?.length > 0) {
        setTimeout(() => {
          this.gridApi.clearCellSelection();
          this.gridApi.setFocusedCell(
            insertIndex,
            this.columnDefs[0].field ?? ''
          );
          this.gridApi.startEditingCell({
            rowIndex: insertIndex,
            colKey: this.columnDefs[0]?.field ?? '',
          });
        }, 100);
      }
    } catch (error) {
      console.error(`Error adding rows ${position}:`, error);
    }
  }

  private deleteRows(cellSelectionBounds: ICellSelectionBounds) {
    try {
      const { cellRangeStartRowIndex, cellRangeEndRowIndex } =
        cellSelectionBounds;
      const start = Math.min(cellRangeStartRowIndex, cellRangeEndRowIndex);
      const end = Math.max(cellRangeStartRowIndex, cellRangeEndRowIndex);

      const rowDataToRemove = [];
      for (let i = start; i <= end; i++) {
        const node = this.gridApi.getDisplayedRowAtIndex(i);
        if (node?.data) rowDataToRemove.push(node.data);
      }

      if (rowDataToRemove.length === 0) return;

      this.gridApi.applyTransaction({ remove: rowDataToRemove });
      this.gridApi.clearCellSelection();
    } catch (error) {
      console.error('Error deleting rows:', error);
    }
  }

  protected getContextMenuItems = (
    params: GetContextMenuItemsParams
  ): (DefaultMenuItem | MenuItemDef)[] => {
    const cellSelectionBounds = this.getCellSelectionBounds();

    if (cellSelectionBounds) {
      const rowCount = cellSelectionBounds.rowCount;
      const rowLabel = `${rowCount} Row${rowCount !== 1 ? 's' : ''}`;

      return [
        {
          name: `Insert ${rowLabel} Above`,
          action: () => this.addRows('above', cellSelectionBounds),
          icon: '<span class="ag-icon ag-icon-plus"></span>',
        },
        {
          name: `Insert ${rowLabel} Below`,
          action: () => this.addRows('below', cellSelectionBounds),
          icon: '<span class="ag-icon ag-icon-plus"></span>',
        },
        'separator',
        {
          name: `Delete ${rowLabel}`,
          action: () => this.deleteRows(cellSelectionBounds),
          icon: '<span class="ag-icon ag-icon-minus"></span>',
        },
        ...(params.defaultItems ?? []),
      ];
    } else {
      return params.defaultItems ?? [];
    }
  };
}
