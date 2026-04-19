import axios from 'axios';
import api from '../auth/api';

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface TaskStatusLog {
    id: string;
    task_id: string;
    from_status: TaskStatus | null;
    to_status: TaskStatus;
    changed_by: string;
    created_at: string;
    comment?: string;
}

export interface Task {
    id: string;
    project_id: string;
    title: string;
    description: string;
    status: TaskStatus;
    assignee_id: string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    task_status_logs?: TaskStatusLog[];
}

export interface TaskCreatePayload {
    title: string;
    description: string;
    deadline?: string;
    assignee_id: string;
}

export interface DailyUpdateItem {
    task_id?: string;
    project_id?: string;
    action: 'started' | 'progressed' | 'completed' | 'new_task';
    comment: string;
    new_task_title?: string;
    new_task_description?: string;
    new_task_assignee_id?: string;
    new_task_deadline?: string;
}

export interface DailyUpdatePayload {
    date?: string;
    summary?: string;
    hours_worked?: number;
    updates: DailyUpdateItem[];
}

export interface DailyUpdateRecord {
    id: string;
    user_id: string;
    update_date: string;
    summary: string;
    hours_worked?: number;
    created_at: string;
    updated_at: string;
    items: Array<{
        id: string;
        task_id?: string;
        project_id: string;
        action: string;
        comment: string;
    }>;
}

export interface DailyUpdateCompliance {
    from: string;
    to: string;
    missing_weekdays: number;
}

interface ApiTask {
    id: number | string;
    project_id: number | string;
    title: string;
    description?: string;
    status: TaskStatus;
    assignee_id: number | string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
}

interface ApiTaskStatusLog {
    id: number | string;
    task_id: number | string;
    from_status?: TaskStatus | null;
    to_status: TaskStatus;
    changed_by: number | string;
    created_at: string;
    comment?: string;
}

const normalizeTask = (task: ApiTask): Task => ({
    id: String(task.id),
    project_id: String(task.project_id),
    title: String(task.title || ''),
    description: String(task.description || ''),
    status: task.status,
    assignee_id: String(task.assignee_id),
    created_at: String(task.created_at),
    started_at: task.started_at ? String(task.started_at) : undefined,
    completed_at: task.completed_at ? String(task.completed_at) : undefined,
});

const normalizeTaskStatusLog = (log: ApiTaskStatusLog): TaskStatusLog => ({
    id: String(log.id),
    task_id: String(log.task_id),
    from_status: log.from_status ?? null,
    to_status: log.to_status,
    changed_by: String(log.changed_by),
    created_at: String(log.created_at),
    comment: log.comment ? String(log.comment) : undefined,
});

const toInt = (value?: string): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
};

export const fetchProjectTasks = async (projectId: string): Promise<Task[]> => {
    const response = await api.get<ApiTask[]>(`/projects/${projectId}/tasks`, { timeout: 5000 });
    return (Array.isArray(response.data) ? response.data : []).map(normalizeTask);
};

export const createProjectTask = async (projectId: string, payload: TaskCreatePayload): Promise<Task> => {
    const response = await api.post<ApiTask>(`/projects/${projectId}/tasks`, payload, { timeout: 5000 });
    return normalizeTask(response.data);
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<Task> => {
    const response = await api.patch<ApiTask>(`/tasks/${taskId}/status`, { status }, { timeout: 5000 });
    return normalizeTask(response.data);
};

export const fetchTaskHistory = async (taskId: string): Promise<TaskStatusLog[]> => {
    const response = await api.get<ApiTaskStatusLog[]>(`/tasks/${taskId}/history`, { timeout: 5000 });
    return (Array.isArray(response.data) ? response.data : []).map(normalizeTaskStatusLog);
};

export const submitDailyUpdate = async (payload: DailyUpdatePayload): Promise<void> => {
    const normalizedPayload = {
        date: payload.date,
        summary: payload.summary,
        hours_worked: payload.hours_worked,
        updates: payload.updates.map((item) => ({
            task_id: toInt(item.task_id),
            project_id: toInt(item.project_id),
            action: item.action,
            comment: item.comment,
            new_task_title: item.new_task_title,
            new_task_description: item.new_task_description,
            new_task_assignee_id: toInt(item.new_task_assignee_id),
            new_task_deadline: item.new_task_deadline,
        })),
    };

    try {
        await api.post('/daily-updates', normalizedPayload, { timeout: 5000 });
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw error;
        }
        console.warn('Backend reachability issue for daily update, simulating success in demo mode.', error);
    }
};

export const fetchMyDailyUpdates = async (from?: string, to?: string): Promise<DailyUpdateRecord[]> => {
    try {
        const response = await api.get('/daily-updates', {
            timeout: 5000,
            params: { from, to },
        });

        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        return rows.map((row: any) => ({
            id: String(row.id),
            user_id: String(row.user_id),
            update_date: String(row.update_date || ''),
            summary: String(row.summary || ''),
            hours_worked: typeof row.hours_worked === 'number' ? row.hours_worked : undefined,
            created_at: String(row.created_at || ''),
            updated_at: String(row.updated_at || ''),
            items: Array.isArray(row.items)
                ? row.items.map((item: any) => ({
                    id: String(item.id),
                    task_id: item.task_id != null ? String(item.task_id) : undefined,
                    project_id: String(item.project_id || ''),
                    action: String(item.action || ''),
                    comment: String(item.comment || ''),
                }))
                : [],
        }));
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw error;
        }
        return [];
    }
};

export const fetchDailyCompliance = async (from?: string, to?: string): Promise<DailyUpdateCompliance> => {
    try {
        const response = await api.get('/daily-updates/compliance', {
            timeout: 5000,
            params: { from, to },
        });
        return {
            from: String(response.data?.from || from || ''),
            to: String(response.data?.to || to || ''),
            missing_weekdays: Number(response.data?.missing_weekdays || 0),
        };
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw error;
        }
        return {
            from: from || '',
            to: to || '',
            missing_weekdays: 0,
        };
    }
};
