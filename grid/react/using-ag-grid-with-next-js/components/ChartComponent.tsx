// components/ChartComponent.tsx
'use client';

import { useEffect, useState } from 'react';
import { AgCharts } from 'ag-charts-react'; 
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const ChartComponent = () => {
    const [rowData, setRowData] = useState<any[]>([]);

    const [chartOptions, setChartOptions] = useState<any>({
        data: [],
        series: [
          { 
            type: 'bar', 
            xKey: 'country', 
            yKey: 'total'
          }
        ],
    });

    useEffect(() => {
        fetch("https://www.ag-grid.com/example-assets/olympic-winners.json")
            .then(result => result.json())
            .then(data => {
                setRowData(data); 
            });
    }, []);

    useEffect(() => {
        if (rowData.length > 0) {
            // Aggregate total medals by country
            const countryTotals: Record<string, number> = {};
            rowData.forEach(d => {
                const country = d.country;
                const total = d.total || 0;
                if (!countryTotals[country]) {
                    countryTotals[country] = 0;
                }
                countryTotals[country] += total;
            });

            // Convert the aggregated object into an array of {country, total}
            const aggregatedData = Object.keys(countryTotals).map(country => ({
                country,
                total: countryTotals[country]
            }));

            setChartOptions((prevOptions: any) => ({
                ...prevOptions,
                data: aggregatedData
            }));
        }
    }, [rowData]);

    return (
        <div className="ag-theme-quartz-dark" style={{ height: 750 }}>
            <AgCharts options={chartOptions} />
        </div>
    )
};

export default ChartComponent;
