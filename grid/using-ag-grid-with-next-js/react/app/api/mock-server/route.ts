// app/api/mock-server/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface SortModel {
  colId: string;
  sort: 'asc' | 'desc';
}

interface IServerSideGetRowsRequest {
  startRow: number;
  endRow: number;
  sortModel?: SortModel[];
}

export async function POST(request: NextRequest) {
  const reqBody = (await request.json()) as IServerSideGetRowsRequest;

  // Fetch data from the external API
  const dataResponse = await fetch(
    'https://www.ag-grid.com/example-assets/olympic-winners.json'
  );
  const olympicData = (await dataResponse.json()) as any[];

  let rows = [...olympicData];

  // Sorting logic
  if (reqBody.sortModel && reqBody.sortModel.length > 0) {
    rows.sort((a, b) => {
      for (const sortDef of reqBody.sortModel!) {
        const { colId, sort } = sortDef;
        const aValue = a[colId];
        const bValue = b[colId];

        if (aValue < bValue) return sort === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const { startRow = 0, endRow = rows.length } = reqBody;
  const requestedRows = rows.slice(startRow, endRow);
  const lastRow = rows.length;

  return NextResponse.json({
    success: true,
    rows: requestedRows,
    lastRow: lastRow,
  });
}
