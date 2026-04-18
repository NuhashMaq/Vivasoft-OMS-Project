import { useQuery } from '@tanstack/react-query';
import { fetchProjectMembers, ProjectMember } from '../api/projects';

export const useProjectMembers = (projectId: string) => {
    return useQuery<ProjectMember[], Error>({
        queryKey: ['projects', projectId, 'members'],
        queryFn: () => fetchProjectMembers(projectId),
        enabled: !!projectId,
    });
};
