import React, { useEffect, useState } from "react";
import type { Project, ProjectStatus } from "../../../types/project";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Project | null;
  onClose: () => void;
  onSubmit: (data: Omit<Project, "id" | "memberCount">) => void;
};

export const ProjectForm: React.FC<Props> = ({ open, mode, initial, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [manager, setManager] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Active");

  useEffect(() => {
    if (mode === "edit" && initial) {
      setName(initial.name);
      setDescription(initial.description);
      setManager(initial.manager);
      setStartDate(initial.startDate);
      setDueDate(initial.dueDate);
      setStatus(initial.status);
    } else {
      setName("");
      setDescription("");
      setManager("");
      setStartDate("");
      setDueDate("");
      setStatus("Active");
    }
  }, [mode, initial, open]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Project name required");
    onSubmit({ name, description, manager, startDate, dueDate, status });
  };

  return (
    <div style={backdrop}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{mode === "create" ? "Create Project" : "Edit Project"}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input style={input} placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={input} placeholder="Manager" value={manager} onChange={(e) => setManager(e.target.value)} />
          <input style={input} placeholder="Start date (YYYY-MM-DD)" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input style={input} placeholder="Due date (YYYY-MM-DD)" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

          <select style={input} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>

          <textarea style={{ ...input, height: 90 }} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">{mode === "create" ? "Create" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modal: React.CSSProperties = {
  width: 460,
  background: "#fff",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
};

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #d9d9d9",
};