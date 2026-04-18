import { useQuery } from '@tanstack/react-query';
import { fetchProjectTasks, Task } from '../api/tasks';

export const useProjectTasks = (projectId: string) => {
    return useQuery<Task[], Error>({
        queryKey: ['projects', projectId, 'tasks'],
        queryFn: () => fetchProjectTasks(projectId),
        enabled: !!projectId,
    });
};
