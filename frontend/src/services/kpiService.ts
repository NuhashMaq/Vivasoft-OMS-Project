import ragApi from './ragClient';

interface KpiData {
  summary: Array<{
    id: string;
    title: string;
    value: number;
    trend?: number;
  }>;
  charts: Array<{
    id: string;
    title: string;
    data: Array<{
      name: string;
      value: number;
    }>;
  }>;
}

interface RAGKPIReport {
  report_id: string;
  employee_id: string;
  project_id: string;
  score: number;
  category: string;
  components: {
    completion_rate: number;
    deadline_adherence: number;
    average_completion_time: number;
    task_complexity: number;
    task_volume: number;
    work_consistency: number;
    productivity_trend: number;
  };
}

const buildEmptyKpi = (): KpiData => ({
  summary: [],
  charts: [],
});

export const getKpiData = async (): Promise<KpiData> => {
  try {
    const authUserRaw = localStorage.getItem('auth_user');
    const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
    const employeeId = authUser?.id ? String(authUser.id) : '';
    const role = String(authUser?.role || '').toLowerCase();

    if (!employeeId) {
      throw new Error('No authenticated user found. Please login again.');
    }
    if (role !== 'super_admin') {
      throw new Error('KPI dashboard requires super_admin access.');
    }

    const response = await ragApi.get<RAGKPIReport>(`/kpi/report?employee_id=${employeeId}`);
    const report = response.data;

    return {
      summary: [
        { id: 'score', title: 'KPI Score', value: Math.round(report.score) },
        { id: 'category', title: `Category (${report.category})`, value: Math.round(report.score) },
      ],
      charts: [
        {
          id: 'components',
          title: 'KPI Components',
          data: [
            { name: 'Completion', value: report.components.completion_rate },
            { name: 'Deadline', value: report.components.deadline_adherence },
            { name: 'Time', value: report.components.average_completion_time },
            { name: 'Complexity', value: report.components.task_complexity },
            { name: 'Volume', value: report.components.task_volume },
            { name: 'Consistency', value: report.components.work_consistency },
            { name: 'Trend', value: report.components.productivity_trend },
          ],
        },
      ],
    };
  } catch (error: any) {
    console.error('KPI API Error:', error);
    const rawMessage = error?.response?.data?.error || error?.message || 'Failed to fetch KPI data';
    const normalized = String(rawMessage).toLowerCase();
    if (normalized.includes('no rows') || normalized.includes('not found')) {
      return buildEmptyKpi();
    }
    throw new Error(rawMessage);
  }
};
