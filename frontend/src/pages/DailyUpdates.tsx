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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
    <div>
      <h2>Daily Updates</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Submit weekday updates with multiple task entries and comments.
      </p>

      <div
        style={{
          background: '#f5f8ff',
          border: '1px solid #d7e2ff',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
        }}
      >
        <strong>Compliance:</strong>{' '}
        {complianceQuery.isLoading
          ? 'Checking...'
          : `${complianceQuery.data?.missing_weekdays ?? 0} weekday submission(s) missing in the selected window.`}
      </div>

      {canSubmitUpdates ? (
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginBottom: '30px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Submit Daily Update</h3>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Optional overall summary for the day"
                style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'inherit' }}
              />
            </div>

            <div
              style={{
                border: '1px solid #e6e6e6',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px',
                background: '#fafafa',
              }}
            >
              <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Add Task Update Item</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select project</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
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
                  value={action}
                  onChange={(e) => setAction(e.target.value as DailyUpdateItem['action'])}
                  style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="started">Started</option>
                  <option value="progressed">Progressed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Comment for this task update"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={{
                    background: '#eef4ff',
                    border: '1px solid #c9d8ff',
                    color: '#2a4ea7',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>

            {pendingItems.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ marginBottom: '10px' }}>Pending Items ({pendingItems.length})</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {pendingItems.map((item, idx) => (
                    <div
                      key={`${item.task_id || 'new'}-${idx}`}
                      style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        padding: '10px',
                        background: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          Task #{item.task_id} • {item.action}
                        </div>
                        <div style={{ color: '#555', fontSize: '14px' }}>{item.comment}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #f0c5c5',
                          color: '#b73b3b',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          height: 'fit-content',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: '#fdeaea',
                  border: '1px solid #f5c2c2',
                  color: '#8f1d1d',
                }}
              >
                {getErrorMessage(error)}
              </div>
            )}

            {isSuccess && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: '#e7f8ec',
                  border: '1px solid #bde5c8',
                  color: '#1f6b34',
                }}
              >
                Daily update submitted successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || pendingItems.length === 0}
              style={{
                background: '#667eea',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isPending || pendingItems.length === 0 ? 0.6 : 1,
              }}
            >
              {isPending ? 'Submitting...' : 'Submit Daily Update'}
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            background: '#fee',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #fcc',
            marginBottom: '30px',
            color: '#c33',
          }}
        >
          You do not have permission to submit daily updates.
        </div>
      )}

      <h3>Recent Updates</h3>
      <div style={{ display: 'grid', gap: '15px' }}>
        {updatesQuery.isLoading && (
          <div
            style={{
              background: '#fff',
              padding: '15px 20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          >
            Loading updates...
          </div>
        )}

        {!updatesQuery.isLoading && (updatesQuery.data?.length || 0) === 0 && (
          <div
            style={{
              background: '#fff',
              padding: '15px 20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          >
            No daily updates found for the selected date range.
          </div>
        )}

        {updatesQuery.data?.map((update) => (
          <div
            key={update.id}
            style={{
              background: '#fff',
              padding: '15px 20px',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', color: '#666' }}>Date: {update.update_date.slice(0, 10)}</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{update.hours_worked ?? 0}h</div>
            </div>

            {update.summary && <p style={{ marginTop: 0 }}>{update.summary}</p>}

            {update.items.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#444' }}>
                {update.items.map((item) => (
                  <li key={item.id}>
                    Task #{item.task_id || 'n/a'} - {item.action}: {item.comment}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
