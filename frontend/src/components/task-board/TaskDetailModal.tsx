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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)'
        }}>
            <div style={{
                background: '#fff',
                width: '100%',
                maxWidth: '600px',
                borderRadius: '8px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh'
            }}>
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>Task Details</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <span style={{
                            fontSize: '11px',
                            background: '#e3f2fd',
                            color: '#1976d2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                        }}>
                            {task.status}
                        </span>
                        <h3 style={{ margin: '15px 0 10px 0' }}>{task.title}</h3>
                        <p style={{ color: '#555', lineHeight: '1.6' }}>{task.description}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                        <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Assignee</p>
                            <p style={{ margin: 0, fontWeight: '600' }}>{task.assignee_id}</p>
                        </div>
                        <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '6px' }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Deadline</p>
                            <p style={{ margin: 0, fontWeight: '600' }}>{(task as any).deadline ? format(new Date((task as any).deadline), 'PPP') : 'No deadline'}</p>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Activity History</h4>
                        {loadingHistory ? (
                            <p style={{ fontSize: '13px', color: '#888' }}>Loading history...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {history?.map((log) => (
                                    <div key={log.id} style={{ display: 'flex', gap: '15px', position: 'relative' }}>
                                        <div style={{ minWidth: '80px', fontSize: '11px', color: '#888' }}>
                                            {format(new Date(log.created_at), 'MMM d, p')}
                                        </div>
                                        <div style={{ fontSize: '13px' }}>
                                            <strong>{log.changed_by}</strong> changed status to <strong>{log.to_status}</strong>
                                            {log.comment && <p style={{ margin: '5px 0 0 0', fontStyle: 'italic', color: '#666' }}>"{log.comment}"</p>}
                                        </div>
                                    </div>
                                ))}
                                {(!history || history.length === 0) && (
                                    <p style={{ fontSize: '13px', color: '#888' }}>No history available.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ padding: '20px', borderTop: '1px solid #ddd', textAlign: 'right' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f0f0f0',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
