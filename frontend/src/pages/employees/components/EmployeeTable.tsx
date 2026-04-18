import React from "react";
import type { Employee } from "../../../types/employee";

type Props = {
  employees: Employee[];
  onDetails?: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
};

export const EmployeeTable: React.FC<Props> = ({
  employees,
  onDetails,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #eee",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: 12 }}>Name</th>
            <th style={{ padding: 12 }}>Email</th>
            <th style={{ padding: 12 }}>Designation</th>
            <th style={{ padding: 12 }}>Department</th>
            <th style={{ padding: 12 }}>Status</th>
            <th style={{ padding: 12, width: 120 }}>Details</th>
            <th style={{ padding: 12, width: 200 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => {
            const fullName = emp.name;
            const statusIcon = emp.status === "Active" ? "💡" : "❌";

            return (
              <tr key={emp.id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                <td style={{ padding: 12 }}>{fullName}</td>
                <td style={{ padding: 12 }}>{emp.email}</td>
                <td style={{ padding: 12 }}>{emp.role}</td>
                <td style={{ padding: 12 }}>{emp.department}</td>
                <td style={{ padding: 12 }}>
                  {statusIcon} {emp.status}
                </td>

                <td style={{ padding: 12 }}>
                  <button
                    onClick={() => onDetails?.(emp)}
                    style={{ padding: "6px 10px" }}
                    disabled={!onDetails}
                  >
                    View
                  </button>
                </td>

                <td style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      onClick={() => onEdit(emp)}
                      style={{ padding: "6px 10px" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(emp)}
                      style={{ padding: "6px 10px" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {employees.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: 16, textAlign: "center" }}>
                No employees found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};