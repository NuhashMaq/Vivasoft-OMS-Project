import React from 'react';
import { Task } from '../../api/tasks';
import { useTaskHistory } from '../../hooks/useTaskHistory';
import { format } from 'date-fns';

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
    const { data: history, isLoading: loadingHistory } = useTaskHistory(task?.id || '');

    if (!isOpen || !task) return null;

    return (
        <div className="task-modal-overlay" onClick={onClose}>
            <div className="task-modal" onClick={(event) => event.stopPropagation()}>
                <div className="task-modal-header">
                    <h2>Task Details</h2>
                    <button onClick={onClose} className="task-modal-close">&times;</button>
                </div>

                <div className="task-modal-content">
                    <div style={{ marginBottom: 18 }}>
                        <span className={`chip ${task.status === 'Done' ? 'chip-status-done' : task.status === 'In Progress' ? 'chip-status-progress' : 'chip-status-todo'}`}>
                            {task.status}
                        </span>
                        <h3 style={{ margin: '14px 0 8px 0' }}>{task.title}</h3>
                        <p className="muted">{task.description || 'No description provided.'}</p>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 20 }}>
                        <div className="card-soft">
                            <p className="kpi-label">Assignee</p>
                            <p style={{ marginTop: 6, fontWeight: 600 }}>{task.assignee_id}</p>
                        </div>

                        <div className="card-soft">
                            <p className="kpi-label">Deadline</p>
                            <p style={{ marginTop: 6, fontWeight: 600 }}>{(task as { deadline?: string }).deadline ? format(new Date((task as { deadline?: string }).deadline as string), 'PPP') : 'No deadline'}</p>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ margin: '0 0 12px 0' }}>Activity History</h4>
                        {loadingHistory ? (
                            <p className="muted">Loading history...</p>
                        ) : (
                            <div className="task-history-list">
                                {history?.map((log) => (
                                    <div key={log.id} className="task-history-item">
                                        <div className="task-history-time">
                                            {format(new Date(log.created_at), 'MMM d, p')}
                                        </div>
                                        <div>
                                            <strong>{log.changed_by}</strong> moved task to <strong>{log.to_status}</strong>
                                            {log.comment && <p className="muted" style={{ marginTop: 4 }}>&quot;{log.comment}&quot;</p>}
                                        </div>
                                    </div>
                                ))}
                                {(!history || history.length === 0) && (
                                    <p className="muted">No history available.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="task-modal-footer">
                    <button onClick={onClose} className="btn btn-ghost">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
