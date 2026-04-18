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

// Demo data for offline/no-backend mode
const DEMO_TASKS: Record<string, Task[]> = {
    'proj-1': [
        {
            id: 'task-1',
            project_id: 'proj-1',
            title: 'Design System Implementation',
            description: 'Create a reusable component library with Tailwind CSS.',
            status: 'In Progress',
            assignee_id: '1', // John Employee
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            started_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'task-2',
            project_id: 'proj-1',
            title: 'User Authentication Flow',
            description: 'Implement JWT-based auth with demo fallback.',
            status: 'Done',
            assignee_id: '1',
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            started_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            completed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'task-3',
            project_id: 'proj-1',
            title: 'Dashboard Wireframing',
            description: 'Layout the main sections for the office management tool.',
            status: 'To Do',
            assignee_id: '2', // Sarah PM
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'task-4',
            project_id: 'proj-1',
            title: 'API Documentation',
            description: 'Write Swagger specs for all existing endpoints.',
            status: 'To Do',
            assignee_id: '3', // Mike
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        }
    ],
    'proj-2': [
        {
            id: 'task-5',
            project_id: 'proj-2',
            title: 'LLM Model Integration',
            description: 'Connect to OpenAI API and set up basic prompting.',
            status: 'In Progress',
            assignee_id: '1',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }
    ]
};

const DEMO_HISTORY: Record<string, TaskStatusLog[]> = {
    'task-1': [
        { id: 'log-1', task_id: 'task-1', from_status: null, to_status: 'To Do', changed_by: 'Sarah PM', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'log-2', task_id: 'task-1', from_status: 'To Do', to_status: 'In Progress', changed_by: 'John Employee', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), comment: 'Starting build-out.' }
    ],
    'task-2': [
        { id: 'log-3', task_id: 'task-2', from_status: null, to_status: 'To Do', changed_by: 'Sarah PM', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'log-4', task_id: 'task-2', from_status: 'To Do', to_status: 'In Progress', changed_by: 'John Employee', created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'log-5', task_id: 'task-2', from_status: 'In Progress', to_status: 'Done', changed_by: 'John Employee', created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), comment: 'Auth is rock solid.' }
    ]
};

const DEMO_DAILY_UPDATES: DailyUpdateRecord[] = [
    {
        id: 'du-1',
        user_id: '1',
        update_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Worked on API integration and fixed bug in task board.',
        hours_worked: 8,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        items: [
            {
                id: 'dui-1',
                task_id: 'task-1',
                project_id: 'proj-1',
                action: 'progressed',
                comment: 'Completed UI wiring and state handling.',
            },
        ],
    },
    {
        id: 'du-2',
        user_id: '1',
        update_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        summary: 'Reviewed auth flow and closed pending review comments.',
        hours_worked: 7.5,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
            {
                id: 'dui-2',
                task_id: 'task-2',
                project_id: 'proj-1',
                action: 'completed',
                comment: 'Merged final authentication checks and docs.',
            },
        ],
    },
];

const toInt = (value?: string): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
};

export const fetchProjectTasks = async (projectId: string): Promise<Task[]> => {
    try {
        const response = await api.get(`/projects/${projectId}/tasks`, { timeout: 3000 });
        return response.data;
    } catch (error) {
        console.warn(`Backend reachability issue for project ${projectId} tasks, falling back to demo data.`, error);
        return DEMO_TASKS[projectId] || [];
    }
};

export const createProjectTask = async (projectId: string, payload: TaskCreatePayload): Promise<Task> => {
    try {
        const response = await api.post(`/projects/${projectId}/tasks`, payload, { timeout: 3000 });
        return response.data;
    } catch (error) {
        console.warn('Backend reachability issue for creating task, simulating success in demo mode.', error);
        const newTask: Task = {
            id: `task-${Math.random().toString(36).substr(2, 9)}`,
            project_id: projectId,
            title: payload.title,
            description: payload.description,
            status: 'To Do',
            assignee_id: payload.assignee_id,
            created_at: new Date().toISOString()
        };
        // Note: In a real demo mode, we might want to push to DEMO_TASKS, but for now just returning is fine for UI feedback
        return newTask;
    }
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<Task> => {
    try {
        const response = await api.patch(`/tasks/${taskId}/status`, { status }, { timeout: 3000 });
        return response.data;
    } catch (error) {
        console.warn(`Backend reachability issue for updating task ${taskId}, simulating success in demo mode.`, error);
        // Returning a partial object that matches what the UI needs
        return { id: taskId, status } as Task;
    }
};

export const fetchTaskHistory = async (taskId: string): Promise<TaskStatusLog[]> => {
    try {
        const response = await api.get(`/tasks/${taskId}/history`, { timeout: 3000 });
        return response.data;
    } catch (error) {
        console.warn(`Backend reachability issue for task ${taskId} history, falling back to demo data.`, error);
        return DEMO_HISTORY[taskId] || [];
    }
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
            timeout: 3000,
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
        console.warn('Backend reachability issue for fetching daily updates, falling back to demo data.', error);
        return DEMO_DAILY_UPDATES;
    }
};

export const fetchDailyCompliance = async (from?: string, to?: string): Promise<DailyUpdateCompliance> => {
    try {
        const response = await api.get('/daily-updates/compliance', {
            timeout: 3000,
            params: { from, to },
        });
        return {
            from: String(response.data?.from || from || ''),
            to: String(response.data?.to || to || ''),
            missing_weekdays: Number(response.data?.missing_weekdays || 0),
        };
    } catch (error) {
        console.warn('Backend reachability issue for compliance view, using fallback value.', error);
        return {
            from: from || '',
            to: to || '',
            missing_weekdays: 0,
        };
    }
};
