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
    created_at: string;
}

// Demo data for offline/no-backend mode
const DEMO_PROJECTS: Project[] = [
    {
        id: 'proj-1',
        name: 'Office Management System',
        description: 'Developing a comprehensive dashboard for office operations.',
        status: 'active',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'proj-2',
        name: 'AI Integration Suite',
        description: 'Implementing LLM-powered tools for internal productivity.',
        status: 'active',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'proj-3',
        name: 'Legacy Migration',
        description: 'Transitioning old services to the new scalable architecture.',
        status: 'on_hold',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    }
];

const DEMO_MEMBERS: Record<string, ProjectMember[]> = {
    'proj-1': [
        { id: '1', name: 'John Employee', email: 'employee@example.com', role: 'employee' },
        { id: '2', name: 'Sarah Project Manager', email: 'pm@example.com', role: 'project_manager' },
        { id: '3', name: 'Mike Designer', email: 'mike@example.com', role: 'employee' },
    ],
    'proj-2': [
        { id: '1', name: 'John Employee', email: 'employee@example.com', role: 'employee' },
        { id: '2', name: 'Sarah Project Manager', email: 'pm@example.com', role: 'project_manager' },
        { id: '4', name: 'AI Specialist', email: 'ai@example.com', role: 'employee' },
    ],
    'proj-3': [
        { id: '2', name: 'Sarah Project Manager', email: 'pm@example.com', role: 'project_manager' },
    ]
};

export const fetchProjects = async (): Promise<Project[]> => {
    try {
        const response = await api.get('/projects', { timeout: 3000 });
        const payload = response.data;

        if (Array.isArray(payload)) {
            return payload;
        }

        if (Array.isArray(payload?.data)) {
            return payload.data.map((project: any) => ({
                id: String(project.id),
                name: String(project.name || ''),
                description: String(project.short_description || project.description || ''),
                status: String(project.status || ''),
                created_at: String(project.created_at || new Date().toISOString()),
            }));
        }

        return [];
    } catch (error) {
        console.warn('Backend reachability issue for /projects, falling back to demo data.', error);
        return DEMO_PROJECTS;
    }
};

export const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    try {
        const response = await api.get(`/projects/${projectId}/roles`, { timeout: 3000 });
        const members = response.data?.members;
        if (!Array.isArray(members)) {
            return [];
        }

        return members.map((member: any) => ({
            id: String(member.user_id),
            name: `${member.first_name || ''} ${member.last_name || ''}`.trim(),
            email: String(member.email || ''),
            role: String(member.role || ''),
        }));
    } catch (error) {
        console.warn(`Backend reachability issue for project ${projectId} members, falling back to demo data.`, error);
        return DEMO_MEMBERS[projectId] || [];
    }
};
