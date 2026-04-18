import { useQuery } from '@tanstack/react-query';
import { fetchTaskHistory, TaskStatusLog } from '../api/tasks';

export const useTaskHistory = (taskId: string) => {
    return useQuery<TaskStatusLog[], Error>({
        queryKey: ['tasks', taskId, 'history'],
        queryFn: () => fetchTaskHistory(taskId),
        enabled: !!taskId,
    });
};
