import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../common/Card';
import './BreakdownChart.css';

interface ChartData {
  name: string;
  value: number;
}

interface BreakdownChartProps {
  title: string;
  data: ChartData[];
}

export const BreakdownChart: React.FC<BreakdownChartProps> = ({ title, data }) => {
  return (
    <Card className="breakdown-chart">
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0F4C75"
            strokeWidth={2}
            dot={{ fill: '#0F4C75', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
