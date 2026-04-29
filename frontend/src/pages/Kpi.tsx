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
      <div className="kpi-page page-shell">
        <h1 className="page-title">KPI Dashboard</h1>
        <div className="error-message">
          Failed to load KPI data: {error}
        </div>
      </div>
    );
  }

  if (!kpiData || (kpiData.summary?.length ?? 0) === 0) {
    return (
      <div className="kpi-page page-shell">
        <h1 className="page-title">KPI Dashboard</h1>
        <p className="muted">No KPI data available yet. Run KPI computation to generate the first report.</p>
      </div>
    );
  }

  return (
    <div className="kpi-page page-shell">
      <div>
        <h1 className="page-title">KPI Dashboard</h1>
        <p className="page-subtitle">AI-generated performance breakdown sourced from RAG telemetry and task lifecycle signals.</p>
      </div>

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
