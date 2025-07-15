// pages/api/fake-server.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface SortModel {
  colId: string;
  sort: 'asc' | 'desc';
}

interface IServerSideGetRowsRequest {
  startRow: number;
  endRow: number;
  sortModel?: SortModel[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // req.body should contain the parsed JSON if you made a request with the appropriate headers.
  const reqBody = req.body as IServerSideGetRowsRequest;

  // Fetch data from the external API
  const dataResponse = await fetch('https://www.ag-grid.com/example-assets/olympic-winners.json');
  const olympicData = await dataResponse.json() as any[];

  const rows = [...olympicData];

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

  res.status(200).json({
    success: true,
    rows: requestedRows,
    lastRow: lastRow
  });
}
