import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  Users,
  FileBarChart2,
  BrainCircuit,
  BookText,
  CalendarCheck2,
  NotebookTabs,
  LogOut,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

type RoleMenuMap = Record<string, MenuItem[]>;

const EMPLOYEE_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "tasks", label: "Tasks", icon: ListChecks, path: "/tasks" },
  { id: "daily_updates", label: "Daily Updates", icon: NotebookTabs, path: "/daily-updates" },
  { id: "attendance", label: "Attendance", icon: CalendarCheck2, path: "/attendance" },
];

const PROJECT_MANAGER_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "projects", label: "Projects", icon: FolderKanban, path: "/projects" },
  { id: "tasks", label: "Tasks", icon: ListChecks, path: "/tasks" },
  { id: "daily_updates", label: "Daily Updates", icon: NotebookTabs, path: "/daily-updates" },
  { id: "attendance", label: "Attendance", icon: CalendarCheck2, path: "/attendance" },
  { id: "wiki", label: "AI Wiki", icon: BookText, path: "/wiki" },
];

const ADMIN_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "employees", label: "Employees", icon: Users, path: "/employees" },
  { id: "projects", label: "Projects", icon: FolderKanban, path: "/projects" },
  { id: "tasks", label: "Tasks", icon: ListChecks, path: "/tasks" },
  { id: "daily_updates", label: "Daily Updates", icon: NotebookTabs, path: "/daily-updates" },
  { id: "reporting", label: "Reporting", icon: FileBarChart2, path: "/reporting" },
  { id: "wiki", label: "AI Wiki", icon: BookText, path: "/wiki" },
];

const SUPER_ADMIN_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: "employees", label: "Employees", icon: Users, path: "/employees" },
  { id: "projects", label: "Projects", icon: FolderKanban, path: "/projects" },
  { id: "tasks", label: "Tasks", icon: ListChecks, path: "/tasks" },
  { id: "daily_updates", label: "Daily Updates", icon: NotebookTabs, path: "/daily-updates" },
  { id: "reporting", label: "Reporting", icon: FileBarChart2, path: "/reporting" },
  { id: "kpi", label: "KPI", icon: BrainCircuit, path: "/kpi" },
  { id: "wiki", label: "AI Wiki", icon: BookText, path: "/wiki" },
];

const ROLE_MENU_MAP: RoleMenuMap = {
  employee: EMPLOYEE_MENU,
  project_manager: PROJECT_MANAGER_MENU,
  manager: PROJECT_MANAGER_MENU,
  admin: ADMIN_MENU,
  super_admin: SUPER_ADMIN_MENU,
};

const prettifyRole = (role: string | undefined): string => {
  const normalized = (role || "employee").replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const roleKey = (user?.role ?? "employee").toLowerCase();
  const menuItems = ROLE_MENU_MAP[roleKey] ?? EMPLOYEE_MENU;

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-badge">OMS</span>
          <div>
            <h2>Project Hub</h2>
            <p>SRS-Aligned Workspace</p>
          </div>
        </div>

        {user && (
          <div className="sidebar-user">
            <div className="user-avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user.name}</p>
              <p className="user-role">{prettifyRole(user.role)}</p>
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul className="menu-list">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`menu-item ${isActive(item.path) ? "active" : ""}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <item.icon size={16} className="menu-icon" />
                <span className="menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
};