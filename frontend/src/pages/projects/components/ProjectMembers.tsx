import React, { useMemo, useState } from "react";
import type { Employee } from "../../../types/employee";

type Props = {
  allEmployees: Employee[];        // dropdown options
  initialMemberIds?: string[];     // initial selected members
};

export const ProjectMembers: React.FC<Props> = ({ allEmployees, initialMemberIds = [] }) => {
  const [memberIds, setMemberIds] = useState<string[]>(initialMemberIds);
  const [selectedId, setSelectedId] = useState<string>("");

  const members = useMemo(
    () => allEmployees.filter((e) => memberIds.includes(e.id)),
    [allEmployees, memberIds]
  );

  const availableEmployees = useMemo(
    () => allEmployees.filter((e) => !memberIds.includes(e.id)),
    [allEmployees, memberIds]
  );

  const addMember = () => {
    if (!selectedId) return;
    setMemberIds((prev) => [...prev, selectedId]);
    setSelectedId("");
  };

  const removeMember = (id: string) => {
    setMemberIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 10 }}>Members</h3>

      {/* Add member row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #d9d9d9", minWidth: 260 }}
        >
          <option value="">Select employee to add</option>
          {availableEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.department})
            </option>
          ))}
        </select>

        <button onClick={addMember} style={{ padding: "10px 14px" }}>
          + Add Member
        </button>
      </div>

      {/* Members list */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14 }}>
        {members.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.7 }}>No members yet.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {members.map((m) => (
              <li
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderBottom: "1px solid #f2f2f2",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.75 }}>
                    {m.email} • {m.department} • {m.role}
                  </div>
                </div>

                <button onClick={() => removeMember(m.id)} style={{ padding: "8px 12px" }}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};