import { useQuery } from '@tanstack/react-query';
import { fetchProjects, Project } from '../api/projects';

export const useProjects = () => {
    return useQuery<Project[], Error>({
        queryKey: ['projects'],
        queryFn: fetchProjects,
    });
};
