import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../common/Card';
import './ComplianceChart.css';

interface ComplianceChartData {
  complianceRate: number;
}

interface ComplianceChartProps {
  data: ComplianceChartData;
}

const COLORS = ['#0F4C75', '#EAF6FB'];

export const ComplianceChart: React.FC<ComplianceChartProps> = ({ data }) => {
  const chartData = [
    { name: 'Compliance', value: data.complianceRate },
    { name: 'Remaining', value: 100 - data.complianceRate },
  ];

  return (
    <Card className="compliance-chart">
      <h4>Compliance Overview</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
