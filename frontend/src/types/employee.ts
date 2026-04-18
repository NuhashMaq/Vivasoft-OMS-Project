export type EmployeeStatus = "Active" | "Inactive";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: EmployeeStatus;
}