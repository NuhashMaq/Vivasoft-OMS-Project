import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTaskStatus, TaskStatus } from '../api/tasks';

interface UpdateTaskParams {
    taskId: string;
    status: TaskStatus;
    projectId: string;
}

export const useUpdateTaskStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ taskId, status }: UpdateTaskParams) => updateTaskStatus(taskId, status),
        onMutate: async (variables) => {
            // Optimistic Update
            const queryKey = ['projects', variables.projectId, 'tasks'];
            await queryClient.cancelQueries({ queryKey });

            const previousTasks = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old: any) => {
                if (!old) return old;
                return old.map((task: any) =>
                    task.id === variables.taskId ? { ...task, status: variables.status } : task
                );
            });

            return { previousTasks, queryKey };
        },
        onError: (err, _variables, context: any) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(context.queryKey, context.previousTasks);
            }
            console.error('Failed to update task status:', err);
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'tasks'] });
        },
    });
};
