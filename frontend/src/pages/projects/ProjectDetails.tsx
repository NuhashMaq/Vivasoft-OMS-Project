import { useParams } from "react-router-dom";
import type { Employee } from "../../types/employee";
import { ProjectMembers } from "./components/ProjectMembers";

export const ProjectDetails = () => {
  const { id } = useParams();

  // ✅ mock employees (later: come from API/Employees store)
  const employees: Employee[] = [
    { id: "1", name: "Arpita Karmakar", email: "arpita@example.com", department: "Engineering", role: "Developer", status: "Active" },
    { id: "2", name: "Hasan Rahman", email: "hasan@example.com", department: "HR", role: "HR Executive", status: "Active" },
    { id: "3", name: "Nadia Islam", email: "nadia@example.com", department: "Finance", role: "Accountant", status: "Inactive" },
    { id: "4", name: "Siam Ahmed", email: "siam@example.com", department: "Engineering", role: "QA", status: "Active" },
  ];

  // ✅ mock project info
  const project = {
    id,
    name: "Office ERP",
    status: "Active",
    manager: "John Admin",
    startDate: "2026-03-01",
    dueDate: "2026-04-15",
    description: "Core office management.",
  };

  return (
    <div>
      <h2>Project Details</h2>
      <p style={{ opacity: 0.7 }}>Project ID: {project.id}</p>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 14, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>{project.name}</h3>
          <span style={{ border: "1px solid #ddd", borderRadius: 999, padding: "4px 10px" }}>{project.status}</span>
        </div>

        <p style={{ marginTop: 10, opacity: 0.85 }}>{project.description}</p>

        <div style={{ display: "grid", gap: 6, marginTop: 10, fontSize: 14 }}>
          <div><b>Manager:</b> {project.manager}</div>
          <div><b>Start:</b> {project.startDate}</div>
          <div><b>Due:</b> {project.dueDate}</div>
        </div>
      </div>

      {/* ✅ Members UI */}
      <ProjectMembers allEmployees={employees} initialMemberIds={["1", "4"]} />
    </div>
  );
};