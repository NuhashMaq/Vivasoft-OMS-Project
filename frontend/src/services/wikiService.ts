import ragApi from './ragClient';
import api from '../auth/api';

export interface WikiArticle {
  id: string;
  title: string;
  description?: string;
  category?: string;
  url?: string;
}

interface RAGSearchResult {
  source_id: string;
  title: string;
  snippet: string;
  doc_type: string;
}

interface RAGSearchResponse {
  results: RAGSearchResult[];
}

interface ProjectListResponse {
  data?: Array<{ id: string | number }>;
}

const resolveActiveProjectId = async (): Promise<string> => {
  const stored = localStorage.getItem('active_project_id');
  if (stored && stored.trim() !== '') {
    return stored;
  }

  const response = await api.get<ProjectListResponse>('/projects?page=1&page_size=1');
  const firstProject = response?.data?.data?.[0];
  if (!firstProject?.id) {
    throw new Error('No active project found. Please create/select a project first.');
  }

  const projectId = String(firstProject.id);
  localStorage.setItem('active_project_id', projectId);
  return projectId;
};

export const searchWiki = async (query: string): Promise<WikiArticle[]> => {
  try {
    const activeProjectId = await resolveActiveProjectId();
    const response = await ragApi.post<RAGSearchResponse>('/search', {
      project_id: activeProjectId,
      query,
      top_k: 8,
    });
    return (response.data.results || []).map((item) => ({
      id: item.source_id,
      title: item.title,
      description: item.snippet,
      category: item.doc_type,
    }));
  } catch (error: any) {
    console.error('Wiki search error:', error);
    const message = error?.response?.data?.error || error?.message || 'Failed to fetch wiki search results';
    throw new Error(message);
  }
};
