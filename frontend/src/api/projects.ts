import api from '../auth/api';

export interface ProjectMember {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    type?: string;
    start_date?: string;
    end_date?: string;
    created_at: string;
}

interface ApiProject {
    id: number | string;
    name: string;
    short_description?: string;
    description?: string;
    status?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
    created_at?: string;
}

interface ProjectListResponse {
    data?: ApiProject[];
}

interface ProjectDetailResponse {
    data?: ApiProject;
}

const normalizeProject = (project: ApiProject): Project => ({
    id: String(project.id),
    name: String(project.name || ''),
    description: String(project.short_description || project.description || ''),
    status: String(project.status || ''),
    type: project.type ? String(project.type) : undefined,
    start_date: project.start_date ? String(project.start_date) : undefined,
    end_date: project.end_date ? String(project.end_date) : undefined,
    created_at: String(project.created_at || new Date().toISOString()),
});

export const fetchProjects = async (): Promise<Project[]> => {
    const response = await api.get<ProjectListResponse>('/projects', {
        timeout: 5000,
        params: { page: 1, page_size: 200 },
    });

    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    return rows.map(normalizeProject);
};

export const fetchProjectById = async (projectId: string): Promise<Project> => {
    const response = await api.get<ProjectDetailResponse>(`/projects/${projectId}`, { timeout: 5000 });
    if (!response.data?.data) {
        throw new Error('Project not found');
    }
    return normalizeProject(response.data.data);
};

export const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    const response = await api.get<{ members?: Array<{
        user_id: number | string;
        first_name?: string;
        last_name?: string;
        email?: string;
        role?: string;
    }> }>(`/projects/${projectId}/roles`, { timeout: 5000 });

    const members = Array.isArray(response.data?.members) ? response.data.members : [];
    return members.map((member) => ({
        id: String(member.user_id),
        name: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
        email: String(member.email || ''),
        role: String(member.role || ''),
    }));
};
