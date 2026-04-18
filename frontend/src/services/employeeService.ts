import  api  from "../auth/api";
import type { Employee } from "../types/employee";

export type CreateEmployeePayload = Omit<Employee, "id">;
export type UpdateEmployeePayload = Partial<Omit<Employee, "id">>;

export const employeeService = {
  // GET /employees
  async getAll(): Promise<Employee[]> {
    const res = await api.get("/employees");
    // backend যদি {data: [...] } দেয়, তখন res.data.data লাগতে পারে
    return res.data;
  },

  // GET /employees/:id
  async getById(id: string): Promise<Employee> {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  },

  // POST /employees
  async create(payload: CreateEmployeePayload): Promise<Employee> {
    const res = await api.post("/employees", payload);
    return res.data;
  },

  // PUT /employees/:id
  async update(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    const res = await api.put(`/employees/${id}`, payload);
    return res.data;
  },

  // DELETE /employees/:id
  async remove(id: string): Promise<void> {
    await api.delete(`/employees/${id}`);
  },
};