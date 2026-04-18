import React, { useEffect, useState } from "react";
import type { Employee } from "../../../types/employee";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Employee | null;
  onClose: () => void;
  onSubmit: (data: Omit<Employee, "id">) => void;
};

export const EmployeeForm: React.FC<Props> = ({ open, mode, initial, onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  useEffect(() => {
    if (mode === "edit" && initial) {
      setName(initial.name);
      setEmail(initial.email);
      setDepartment(initial.department);
      setRole(initial.role);
      setStatus(initial.status);
    } else {
      setName("");
      setEmail("");
      setDepartment("");
      setRole("");
      setStatus("Active");
    }
  }, [mode, initial, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Name and Email are required");
      return;
    }
    onSubmit({ name, email, department, role, status });
  };

  return (
    <div style={backdrop}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{mode === "create" ? "Add Employee" : "Edit Employee"}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={input} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
          <input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} style={input} />
          <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} style={input} />

          <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={input}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={btn}>
              Cancel
            </button>
            <button type="submit" style={btnPrimary}>
              {mode === "create" ? "Create" : "Save"}
            </button>
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
  width: 420,
  background: "#fff",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
};

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #d9d9d9",
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #d9d9d9",
  background: "#fff",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #cfcfcf",
  fontWeight: 600,
};