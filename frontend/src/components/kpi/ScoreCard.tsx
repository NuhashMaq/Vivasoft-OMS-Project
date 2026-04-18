import React from 'react';
import { Card } from '../common/Card';
import './ScoreCard.css';

interface ScoreCardProps {
  title: string;
  value: number | string;
  trend?: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ title, value, trend }) => {
  return (
    <Card className="score-card">
      <h3>{value}</h3>
      <p>{title}</p>
      {trend !== undefined && (
        <div className={`trend ${trend >= 0 ? 'positive' : 'negative'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </Card>
  );
};
