import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../auth/rbac';
import { useDailyUpdate } from '../hooks/useDailyUpdate';
import { useProjects } from '../hooks/useProjects';
import { useProjectTasks } from '../hooks/useProjectTasks';
import {
  DailyUpdateItem,
  DailyUpdatePayload,
  fetchDailyCompliance,
  fetchMyDailyUpdates,
} from '../api/tasks';

const toDateInput = (date: Date): string => date.toISOString().slice(0, 10);

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (typeof response?.data?.error === 'string' && response.data.error.length > 0) {
      return response.data.error;
    }
  }
  return 'Failed to submit daily update.';
};

export const DailyUpdates: React.FC = () => {
  const { user } = useAuth();
  const canSubmitUpdates = hasPermission(user?.role, 'canSubmitDailyUpdates');
  const { mutate: submitDailyUpdate, isPending, isSuccess, error } = useDailyUpdate();
  const { data: projects } = useProjects();

  const today = React.useMemo(() => toDateInput(new Date()), []);
  const defaultFrom = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return toDateInput(date);
  }, []);

  const [date, setDate] = React.useState(today);
  const [summary, setSummary] = React.useState('');
  const [hoursWorked, setHoursWorked] = React.useState('8');
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(
    localStorage.getItem('active_project_id') || ''
  );
  const [selectedTaskId, setSelectedTaskId] = React.useState('');
  const [action, setAction] = React.useState<DailyUpdateItem['action']>('progressed');
  const [comment, setComment] = React.useState('');
  const [pendingItems, setPendingItems] = React.useState<DailyUpdateItem[]>([]);

  const { data: projectTasks } = useProjectTasks(selectedProjectId);

  const updatesQuery = useQuery({
    queryKey: ['daily-updates', 'mine', defaultFrom, today],
    queryFn: () => fetchMyDailyUpdates(defaultFrom, today),
  });

  const complianceQuery = useQuery({
    queryKey: ['daily-updates', 'compliance', defaultFrom, today],
    queryFn: () => fetchDailyCompliance(defaultFrom, today),
  });

  const handleAddItem = () => {
    if (!selectedTaskId || !comment.trim()) {
      return;
    }

    const item: DailyUpdateItem = {
      task_id: selectedTaskId,
      project_id: selectedProjectId || undefined,
      action,
      comment: comment.trim(),
    };

    setPendingItems((prev) => [item, ...prev]);
    setComment('');
  };

  const handleRemoveItem = (index: number) => {
    setPendingItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmitUpdates || pendingItems.length === 0) {
      return;
    }

    const payload: DailyUpdatePayload = {
      date,
      summary,
      hours_worked: Number(hoursWorked),
      updates: pendingItems,
    };

    submitDailyUpdate(payload, {
      onSuccess: () => {
        setSummary('');
        setComment('');
        setPendingItems([]);
      },
    });
  };

  return (
    <div className="page-shell">
      <div className="page-headline">
        <div>
          <h2 className="page-title">Daily Updates</h2>
          <p className="page-subtitle">
            Submit weekday execution notes with task-level actions to satisfy SRS compliance and reporting.
          </p>
        </div>
      </div>

      <section className="kpi-strip">
        <article className="kpi-card">
          <p className="kpi-label">Missing Weekdays</p>
          <p className="kpi-value">{complianceQuery.data?.missing_weekdays ?? 0}</p>
          <p className="kpi-foot">In last 14 days</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Recent Submissions</p>
          <p className="kpi-value">{updatesQuery.data?.length ?? 0}</p>
          <p className="kpi-foot">Visible in current window</p>
        </article>
      </section>

      {canSubmitUpdates ? (
        <section className="panel">
          <h3 className="panel-title">Submit Daily Update</h3>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <div className="controls-row">
              <div>
                <label className="kpi-label">Date</label>
                <input
                  className="field"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>

              <div>
                <label className="kpi-label">Hours Worked</label>
                <input
                  className="field"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hoursWorked}
                  onChange={(event) => setHoursWorked(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="kpi-label">Summary</label>
              <textarea
                className="field-area"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Optional overall summary for the day"
              />
            </div>

            <div className="card-soft" style={{ display: 'grid', gap: 10 }}>
              <h4 style={{ margin: 0 }}>Add Task Update Item</h4>
              <div className="controls-row">
                <select
                  className="field-select"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                >
                  <option value="">Select project</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <select
                  className="field-select"
                  value={selectedTaskId}
                  onChange={(event) => setSelectedTaskId(event.target.value)}
                  disabled={!selectedProjectId}
                >
                  <option value="">Select task</option>
                  {projectTasks?.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>

                <select
                  className="field-select"
                  value={action}
                  onChange={(event) => setAction(event.target.value as DailyUpdateItem['action'])}
                >
                  <option value="started">Started</option>
                  <option value="progressed">Progressed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  className="field"
                  type="text"
                  placeholder="Comment for this update item"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  style={{ flex: 1, minWidth: 220 }}
                />
                <button type="button" className="btn btn-ghost" onClick={handleAddItem}>
                  Add Item
                </button>
              </div>
            </div>

            {pendingItems.length > 0 && (
              <div style={{ display: 'grid', gap: 8 }}>
                {pendingItems.map((item, idx) => (
                  <article key={`${item.task_id || 'new'}-${idx}`} className="card-soft" style={{ padding: 10 }}>
                    <div className="page-headline" style={{ alignItems: 'center' }}>
                      <p style={{ fontWeight: 600 }}>
                        Task #{item.task_id || 'n/a'} • {item.action}
                      </p>
                      <button type="button" className="btn btn-danger" onClick={() => handleRemoveItem(idx)}>
                        Remove
                      </button>
                    </div>
                    <p className="muted" style={{ marginTop: 6 }}>{item.comment}</p>
                  </article>
                ))}
              </div>
            )}

            {error && (
              <div className="card-soft" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(254,226,226,0.65)' }}>
                <p>{getErrorMessage(error)}</p>
              </div>
            )}

            {isSuccess && (
              <div className="card-soft" style={{ borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(209,250,229,0.6)' }}>
                <p>Daily update submitted successfully.</p>
              </div>
            )}

            <div>
              <button type="submit" className="btn btn-primary" disabled={isPending || pendingItems.length === 0}>
                {isPending ? 'Submitting...' : 'Submit Daily Update'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel">
          <p className="muted">Your role can view updates but cannot submit them.</p>
        </section>
      )}

      <section className="panel">
        <h3 className="panel-title">Recent Updates</h3>

        {updatesQuery.isLoading && <p className="muted">Loading updates...</p>}

        {!updatesQuery.isLoading && (updatesQuery.data?.length || 0) === 0 && (
          <p className="muted">No daily updates found for the selected period.</p>
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          {updatesQuery.data?.map((update) => (
            <article key={update.id} className="card-soft">
              <div className="page-headline" style={{ alignItems: 'center' }}>
                <p className="kpi-label">{update.update_date.slice(0, 10)}</p>
                <p className="kpi-foot">{update.hours_worked ?? 0}h</p>
              </div>
              {update.summary && <p style={{ marginTop: 8 }}>{update.summary}</p>}
              {update.items.length > 0 && (
                <ul style={{ marginTop: 8, marginBottom: 0, color: '#2d4769' }}>
                  {update.items.map((item) => (
                    <li key={item.id}>
                      Task #{item.task_id || 'n/a'} - {item.action}: {item.comment}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
