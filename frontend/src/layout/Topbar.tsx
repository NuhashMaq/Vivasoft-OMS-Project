import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import './Topbar.css';

const ROUTE_META: Array<{ match: RegExp; title: string; subtitle: string }> = [
  { match: /^\/$/, title: 'Executive Dashboard', subtitle: 'Delivery momentum, team capacity, and SRS milestones' },
  { match: /^\/employees/, title: 'Employee Directory', subtitle: 'Org graph, capacity, and assignment readiness' },
  { match: /^\/projects\/[0-9]+$/, title: 'Project Workspace', subtitle: 'Members, scope, timeline, and delivery status' },
  { match: /^\/projects/, title: 'Project Portfolio', subtitle: 'Program-level visibility across active and queued initiatives' },
  { match: /^\/tasks/, title: 'Kanban Command Center', subtitle: 'Plan, pull, and progress tasks across projects' },
  { match: /^\/daily-updates/, title: 'Daily Updates', subtitle: 'Weekday compliance and execution narrative' },
  { match: /^\/attendance/, title: 'Attendance Ops', subtitle: 'Presence, overtime, and work-hour trends' },
  { match: /^\/reporting/, title: 'Reporting Suite', subtitle: 'Operational scorecards and completion analytics' },
  { match: /^\/kpi/, title: 'KPI Intelligence', subtitle: 'AI-assisted performance scoring from RAG signals' },
  { match: /^\/wiki/, title: 'Knowledge Wiki', subtitle: 'Grounded AI retrieval and project knowledge memory' },
];

const humanizeRole = (role?: string): string => {
  const value = (role || 'employee').replace(/_/g, ' ');
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const [searchValue, setSearchValue] = useState('');
  const { user } = useAuth();

  const pageMeta = useMemo(() => {
    const match = ROUTE_META.find((item) => item.match.test(location.pathname));
    return match || ROUTE_META[0];
  }, [location.pathname]);

  const today = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    []
  );

  return (
    <div className="topbar">
      <div className="topbar-container">
        <div className="topbar-title">
          <h1>{pageMeta.title}</h1>
          <p>{pageMeta.subtitle}</p>
        </div>

        <div className="topbar-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search tasks, projects, people..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="topbar-profile">
          <div className="profile-meta">
            <span>{today}</span>
            <span className="profile-role-chip">
              <Sparkles size={13} />
              {humanizeRole(user?.role)}
            </span>
          </div>
          <div className="profile-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            <p className="profile-name">{user?.name || 'Workspace User'}</p>
            <p className="profile-role">{user?.email || 'OMS2 session'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
