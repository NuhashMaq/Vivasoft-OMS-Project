import { useMemo, useState } from "react";
import type { Employee } from "../../types/employee";
import { EmployeeFilter } from "./components/EmployeeFilter";
import { EmployeeTable } from "./components/EmployeeTable";
import { EmployeeForm } from "./components/EmployeeForm";

export const Employees = () => {
  // ✅ 1) employees array -> state
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "1",
      name: "Arpita Karmakar",
      email: "arpita@example.com",
      department: "Engineering",
      role: "Developer",
      status: "Active",
    },
    {
      id: "2",
      name: "Hasan Rahman",
      email: "hasan@example.com",
      department: "HR",
      role: "HR Executive",
      status: "Active",
    },
    {
      id: "3",
      name: "Nadia Islam",
      email: "nadia@example.com",
      department: "Finance",
      role: "Accountant",
      status: "Inactive",
    },
    {
      id: "4",
      name: "Siam Ahmed",
      email: "siam@example.com",
      department: "Engineering",
      role: "QA",
      status: "Active",
    },
  ]);

  // filters state
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  // ✅ 2) modal state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))).sort(),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchSearch =
        !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
      const matchDept = !department || e.department === department;
      const matchStatus = !status || e.status === status;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, department, status]);

  // ✅ Add click -> open modal (create)
  const onAdd = () => {
    setFormMode("create");
    setSelectedEmployee(null);
    setFormOpen(true);
  };

  // ✅ Edit click -> open modal + initial data
  const onEdit = (emp: Employee) => {
    setFormMode("edit");
    setSelectedEmployee(emp);
    setFormOpen(true);
  };

  // ✅ Delete confirm -> ok হলে remove from state
  const onDelete = (emp: Employee) => {
    const ok = window.confirm(`Are you sure you want to delete ${emp.name}?`);
    if (!ok) return;

    setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
  };

  const onDetails = (emp: Employee) => {
    window.alert(`Employee: ${emp.name}\nEmail: ${emp.email}\nDepartment: ${emp.department}\nRole: ${emp.role}`);
  };

  // ✅ Form submit -> state update (create/edit)
  const onSubmitForm = (data: Omit<Employee, "id">) => {
    if (formMode === "create") {
      const newEmp: Employee = {
        id: crypto.randomUUID(), // modern browsers
        ...data,
      };
      setEmployees((prev) => [newEmp, ...prev]);
    } else {
      // edit mode
      if (!selectedEmployee) return;

      setEmployees((prev) =>
        prev.map((e) => (e.id === selectedEmployee.id ? { ...e, ...data } : e))
      );
    }

    // close modal
    setFormOpen(false);
    setSelectedEmployee(null);
    setFormMode("create");
  };

  const onCloseForm = () => {
    setFormOpen(false);
    setSelectedEmployee(null);
    setFormMode("create");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2>Employee Directory</h2>
          <p style={{ opacity: 0.7 }}>Manage employees (FE2)</p>
        </div>

        <button onClick={onAdd} style={{ padding: "10px 14px" }}>
          + Add Employee
        </button>
      </div>

      <EmployeeFilter
        search={search}
        onSearchChange={setSearch}
        department={department}
        onDepartmentChange={setDepartment}
        status={status}
        onStatusChange={setStatus}
        departments={departments}
      />

      <EmployeeTable employees={filteredEmployees} onDetails={onDetails} onEdit={onEdit} onDelete={onDelete} />

      {/* ✅ Modal */}
      <EmployeeForm
        open={formOpen}
        mode={formMode}
        initial={selectedEmployee}
        onClose={onCloseForm}
        onSubmit={onSubmitForm}
      />
    </div>
  );
};