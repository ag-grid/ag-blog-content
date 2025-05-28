import { useState } from "react";
import "ag-charts-enterprise";
import { AgCharts } from "ag-charts-react";
import { AgChartOptions } from "ag-charts-enterprise";
import { getBoxData } from "../utils/data";

function BoxPlot() {
  const [options, setOptions] = useState<AgChartOptions>({
    title: {
      text: "HR Analytics",
    },
    subtitle: {
      text: "Salary Distribution by Department",
    },
    data: getBoxData(),
      series: [
        {
          type: "box-plot",
          yName: "Employee Salaries",
          xKey: "department",
          minKey: "min",
          q1Key: "q1",
          medianKey: "median",
          q3Key: "q3",
          maxKey: "max",
        },
      ],
  });

  return <AgCharts options={options} />;
};

export default BoxPlot;