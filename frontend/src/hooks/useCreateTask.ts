import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProjectTask, TaskCreatePayload } from '../api/tasks';

interface CreateTaskParams {
    projectId: string;
    payload: TaskCreatePayload;
}

export const useCreateTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ projectId, payload }: CreateTaskParams) =>
            createProjectTask(projectId, payload),
        onSuccess: (_data, variables) => {
            // Invalidate the tasks list for the specific project
            queryClient.invalidateQueries({
                queryKey: ['projects', variables.projectId, 'tasks']
            });
        },
    });
};
