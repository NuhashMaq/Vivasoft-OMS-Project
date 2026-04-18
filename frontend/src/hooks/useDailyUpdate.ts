import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitDailyUpdate, DailyUpdatePayload } from '../api/tasks';

export const useDailyUpdate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: DailyUpdatePayload) => submitDailyUpdate(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-updates'] });
        },
    });
};
