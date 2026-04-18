import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Project, ProjectStatus } from "../../types/project";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectForm } from "./components/ProjectForm";

export const Projects = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([
    { id: "p1", name: "Office ERP", description: "Core office management.", manager: "John Admin", startDate: "2026-03-01", dueDate: "2026-04-15", status: "Active", memberCount: 5 },
    { id: "p2", name: "Attendance System", description: "Tracking & reporting.", manager: "Sarah", startDate: "2026-03-02", dueDate: "2026-03-30", status: "On Hold", memberCount: 3 },
    { id: "p3", name: "AI KPI Engine", description: "KPI scoring module.", manager: "Nadia", startDate: "2026-03-05", dueDate: "2026-04-30", status: "Completed", memberCount: 4 },
  ]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.manager.toLowerCase().includes(q);
      const matchStatus = !status || p.status === status;
      return matchSearch && matchStatus;
    });
  }, [projects, search, status]);

  const onAdd = () => {
    setFormMode("create");
    setSelected(null);
    setFormOpen(true);
  };

  const onEdit = (p: Project) => {
    setFormMode("edit");
    setSelected(p);
    setFormOpen(true);
  };

  const onDelete = (p: Project) => {
    const ok = window.confirm(`Delete project "${p.name}"?`);
    if (!ok) return;
    setProjects((prev) => prev.filter((x) => x.id !== p.id));
  };

  const onView = (p: Project) => navigate(`/projects/${p.id}`);

  const onSubmit = (data: Omit<Project, "id" | "memberCount">) => {
    if (formMode === "create") {
      const id = String(Date.now());
      setProjects((prev) => [{ id, memberCount: 0, ...data }, ...prev]);
    } else {
      if (!selected) return;
      setProjects((prev) => prev.map((x) => (x.id === selected.id ? { ...x, ...data } : x)));
    }
    setFormOpen(false);
    setSelected(null);
    setFormMode("create");
  };

  const onClose = () => {
    setFormOpen(false);
    setSelected(null);
    setFormMode("create");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2>Projects</h2>
          <p style={{ opacity: 0.7 }}>Manage projects (FE2)</p>
        </div>
        <button onClick={onAdd} style={{ padding: "10px 14px" }}>+ Create Project</button>
      </div>

      <div style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search project/manager..."
          style={{ padding: 10, borderRadius: 10, border: "1px solid #d9d9d9", minWidth: 260 }}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #d9d9d9" }}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>

      <ProjectForm open={formOpen} mode={formMode} initial={selected} onClose={onClose} onSubmit={onSubmit} />
    </div>
  );
};