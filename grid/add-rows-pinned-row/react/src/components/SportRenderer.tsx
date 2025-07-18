import React from 'react';
import type { ICellRendererParams } from 'ag-grid-community';

interface SportRendererProps extends ICellRendererParams {
  value: string;
}

const sportIconMap: Record<string, string> = {
  Swimming: 'swimming',
  Gymnastics: 'running',
  Cycling: 'biking',
  'Ski Jumping': 'skiing',
};

export const SportRenderer: React.FC<SportRendererProps> = ({
  value,
  valueFormatted,
}) => {
  const getValueToDisplay = () => {
    return valueFormatted || value;
  };

  return (
    <div>
      <i className={`fa-solid fa-person-${sportIconMap[value]}`}></i>
      <span style={{ marginLeft: '5px' }}>{getValueToDisplay()}</span>
    </div>
  );
};
