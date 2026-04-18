import  api  from "../auth/api";
import type { Project } from "../types/project";

export type CreateProjectPayload = Omit<Project, "id" | "memberCount"> & {
  memberCount?: number;
};
export type UpdateProjectPayload = Partial<Omit<Project, "id">>;

export const projectService = {
  // GET /projects
  async getAll(): Promise<Project[]> {
    const res = await api.get("/projects");
    return res.data;
  },

  // GET /projects/:id
  async getById(id: string): Promise<Project> {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  // POST /projects
  async create(payload: CreateProjectPayload): Promise<Project> {
    const res = await api.post("/projects", payload);
    return res.data;
  },

  // PUT /projects/:id
  async update(id: string, payload: UpdateProjectPayload): Promise<Project> {
    const res = await api.put(`/projects/${id}`, payload);
    return res.data;
  },

  // DELETE /projects/:id
  async remove(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },

  // POST /projects/:id/members  (payload format BE-2 confirm লাগবে)
  async addMember(projectId: string, empId: string): Promise<void> {
    await api.post(`/projects/${projectId}/members`, { empId });
  },

  // DELETE /projects/:id/members/:empId
  async removeMember(projectId: string, empId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${empId}`);
  },
};