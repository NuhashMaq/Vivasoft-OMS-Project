// Stub service - returns mock data until backend is ready
interface ReportData {
  totalTasks: number;
  completedTasks: number;
  complianceRate: number;
  avgCompletionTime: number;
}

export const getReportData = async (): Promise<ReportData> => {
  // Simulate API delay
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        totalTasks: 120,
        completedTasks: 98,
        complianceRate: 92,
        avgCompletionTime: 3.4,
      });
    }, 500);
  });
};
