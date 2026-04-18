import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

interface RoleMenuMap {
  [key: string]: MenuItem[];
}

// ✅ Menus (single source)
const EMPLOYEE_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { id: "tasks", label: "Tasks", icon: "✓", path: "/tasks" },
  { id: "daily_updates", label: "Daily Updates", icon: "📝", path: "/daily-updates" },
  { id: "attendance", label: "Attendance", icon: "📅", path: "/attendance" },
];

const PROJECT_MANAGER_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { id: "projects", label: "Projects", icon: "📁", path: "/projects" },
  { id: "tasks", label: "Tasks", icon: "✓", path: "/tasks" },
  { id: "daily_updates", label: "Daily Updates", icon: "📝", path: "/daily-updates" },
  { id: "attendance", label: "Attendance", icon: "📅", path: "/attendance" },
];

const TEAM_LEAD_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { id: "team_view", label: "Team View", icon: "👥", path: "/team" },
  { id: "projects", label: "Projects", icon: "📁", path: "/projects" },
  { id: "reports", label: "Reports", icon: "📈", path: "/reports" },
];

const ADMIN_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { id: "employees", label: "Employees", icon: "👥", path: "/employees" },
  { id: "projects", label: "Projects", icon: "📁", path: "/projects" },
  { id: "tasks", label: "Tasks", icon: "✓", path: "/tasks" },
  { id: "reports", label: "Reports", icon: "📈", path: "/reporting" },
  { id: "wiki", label: "Wiki", icon: "📚", path: "/wiki" },
];

const SUPER_ADMIN_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
  { id: "employees", label: "Employees", icon: "👥", path: "/employees" },
  { id: "projects", label: "Projects", icon: "📁", path: "/projects" },
  { id: "tasks", label: "Tasks", icon: "✓", path: "/tasks" },
  { id: "reports", label: "Reports", icon: "📈", path: "/reporting" },
  { id: "kpi", label: "KPI", icon: "📉", path: "/kpi" },
  { id: "wiki", label: "AI Wiki", icon: "🤖", path: "/wiki" },
];

// ✅ Role map: keep ONLY this
const ROLE_MENU_MAP: RoleMenuMap = {
  employee: EMPLOYEE_MENU,
  project_manager: PROJECT_MANAGER_MENU,
  team_lead: TEAM_LEAD_MENU,
  admin: ADMIN_MENU,
  super_admin: SUPER_ADMIN_MENU,
};

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // ✅ normalize role (handles SUPER_ADMIN / super_admin etc.)
  const roleKey = (user?.role ?? "employee").toLowerCase();

  const menuItems = ROLE_MENU_MAP[roleKey] ?? EMPLOYEE_MENU;

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <h2>Office</h2>
        </div>

        {user && (
          <div className="sidebar-user">
            <div className="user-avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user.name}</p>
              <p className="user-role">{user.role}</p>
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
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};