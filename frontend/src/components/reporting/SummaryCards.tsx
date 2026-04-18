import React from 'react';
import { Card } from '../common/Card';
import './SummaryCards.css';

interface SummaryData {
  totalTasks: number;
  completedTasks: number;
  complianceRate: number;
  avgCompletionTime: number;
}

interface SummaryCardsProps {
  data: SummaryData;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  return (
    <div className="summary-cards">
      <Card>
        <h4>Total Tasks</h4>
        <h2>{data.totalTasks}</h2>
      </Card>

      <Card>
        <h4>Completed Tasks</h4>
        <h2>{data.completedTasks}</h2>
      </Card>

      <Card>
        <h4>Compliance Rate</h4>
        <h2>{data.complianceRate}%</h2>
      </Card>

      <Card>
        <h4>Avg Completion Time</h4>
        <h2>{data.avgCompletionTime} days</h2>
      </Card>
    </div>
  );
};
