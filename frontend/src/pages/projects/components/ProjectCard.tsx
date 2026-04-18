import React from "react";
import type { Project } from "../../../types/project";

type Props = {
  project: Project;
  onView: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
};

export const ProjectCard: React.FC<Props> = ({ project, onView, onEdit, onDelete }) => {
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <h3 style={{ margin: 0 }}>{project.name}</h3>
        <span style={badge}>{project.status}</span>
      </div>

      <p style={{ opacity: 0.8, marginTop: 8 }}>{project.description}</p>

      <div style={{ display: "grid", gap: 6, marginTop: 10, fontSize: 14 }}>
        <div><b>Manager:</b> {project.manager}</div>
        <div><b>Members:</b> {project.memberCount}</div>
        <div><b>Start:</b> {project.startDate}</div>
        <div><b>Due:</b> {project.dueDate}</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={() => onView(project)}>View</button>
        <button onClick={() => onEdit(project)}>Edit</button>
        <button onClick={() => onDelete(project)}>Delete</button>
      </div>
    </div>
  );
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 14,
  padding: 14,
};

const badge: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #ddd",
  height: 24,
  display: "inline-flex",
  alignItems: "center",
};