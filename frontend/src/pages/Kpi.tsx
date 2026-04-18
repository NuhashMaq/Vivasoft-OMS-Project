import React, { useEffect, useState } from 'react';
import { ScoreCard } from '../components/kpi/ScoreCard';
import { BreakdownChart } from '../components/kpi/BreakdownChart';
import { Loader } from '../components/common/Loader';
import { getKpiData } from '../services/kpiService';
import './KpiPage.css';

interface KpiSummary {
  id: string;
  title: string;
  value: number;
  trend?: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface Chart {
  id: string;
  title: string;
  data: ChartData[];
}

interface KpiData {
  summary: KpiSummary[];
  charts: Chart[];
}

export const KpiPage: React.FC = () => {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKpi = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getKpiData();
        setKpiData(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch KPI data';
        console.error('Error fetching KPI data:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchKpi();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="kpi-page">
        <h1>KPI Dashboard</h1>
        <div className="error-message">
          Failed to load KPI data: {error}
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="kpi-page">
        <h1>KPI Dashboard</h1>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="kpi-page">
      <h1>KPI Dashboard</h1>

      <div className="kpi-summary">
        {kpiData.summary?.map(item => (
          <ScoreCard
            key={item.id}
            title={item.title}
            value={item.value}
            trend={item.trend}
          />
        ))}
      </div>

      <div className="kpi-charts">
        {kpiData.charts?.map(chart => (
          <BreakdownChart
            key={chart.id}
            title={chart.title}
            data={chart.data}
          />
        ))}
      </div>
    </div>
  );
};
