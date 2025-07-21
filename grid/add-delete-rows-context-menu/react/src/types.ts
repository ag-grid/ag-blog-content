export interface IOlympicData {
  athlete: string;
  age: number;
  country: string;
  year: number;
  date: string;
  sport: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export interface ICellSelectionBounds {
  startIndex: number;
  endIndex: number;
  rowCount: number;
}

export type AddRowPosition = 'above' | 'below';
