import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../common/Card';
import './TaskChart.css';

interface TaskChartData {
  totalTasks: number;
  completedTasks: number;
}

interface TaskChartProps {
  data: TaskChartData;
}

export const TaskChart: React.FC<TaskChartProps> = ({ data }) => {
  const chartData = [
    { name: 'Completed', value: data.completedTasks },
    { name: 'Pending', value: data.totalTasks - data.completedTasks },
  ];

  return (
    <Card className="task-chart">
      <h4>Task Completion</h4>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill={getComputedStyle(document.documentElement).getPropertyValue('--primary-dark').trim()} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
