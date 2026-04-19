import React, { useEffect, useState } from 'react';
import { Filters } from '../components/reporting/Filters';
import { SummaryCards } from '../components/reporting/SummaryCards';
import { TaskChart } from '../components/reporting/TaskChart';
import { ComplianceChart } from '../components/reporting/ComplianceChart';
import { Loader } from '../components/common/Loader';
import { getReportData } from '../services/reportService';
import './ReportingPage.css';

interface ReportData {
  totalTasks: number;
  completedTasks: number;
  complianceRate: number;
  avgCompletionTime: number;
}

export const ReportingPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getReportData();
        setReportData(data);
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (!reportData) {
    return (
      <div className="page-shell">
        <div className="panel">
          <p className="muted">No reporting data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reporting-page page-shell">
      <div className="reporting-header">
        <div>
          <h1 className="page-title">Reporting Dashboard</h1>
          <p className="page-subtitle">Cross-project execution analytics, completion rates, and compliance rollups.</p>
        </div>
      </div>

      <Filters />

      <div className="summary-section">
        <SummaryCards data={reportData} />
      </div>

      <div className="charts-grid">
        <TaskChart data={reportData} />
        <ComplianceChart data={reportData} />
      </div>
    </div>
  );
};
