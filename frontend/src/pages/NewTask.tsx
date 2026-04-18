import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useCreateTask } from '../hooks/useCreateTask';

export const NewTask: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: projects } = useProjects();

    const [selectedProjectId, setSelectedProjectId] = useState('');
    const { data: members, isLoading: loadingMembers } = useProjectMembers(selectedProjectId);
    const { mutate: createTask, isPending, error: submitError } = useCreateTask();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [assigneeId, setAssigneeId] = useState(user?.id || '');
    const [successMessage, setSuccessMessage] = useState('');

    const titleRef = useRef<HTMLInputElement>(null);

    // UX: Auto-focus on Title field when page loads
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.focus();
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjectId || !title.trim()) return;

        createTask(
            {
                projectId: selectedProjectId,
                payload: {
                    title,
                    description,
                    deadline: deadline || undefined,
                    assignee_id: assigneeId,
                },
            },
            {
                onSuccess: () => {
                    setSuccessMessage('Task created successfully!');
                    setTitle('');
                    setDescription('');
                    setDeadline('');
                    setAssigneeId(user?.id || '');
                    // UX: Refocus after success
                    titleRef.current?.focus();

                    // Optional: Navigate back to tasks after a short delay
                    setTimeout(() => {
                        setSuccessMessage('');
                    }, 3000);
                },
            }
        );
    };

    const canSelectAssignee = user?.role === 'super_admin' || user?.role === 'project_manager';

    return (
        <div className="new-task-page">
            <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button
                    onClick={() => navigate('/tasks')}
                    style={{
                        background: '#f0f0f0',
                        border: 'none',
                        padding: '8px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    ← Back
                </button>
                <h2 style={{ margin: 0 }}>Create New Task</h2>
            </div>

            <div style={{
                background: '#fff',
                padding: '30px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                maxWidth: '800px'
            }}>
                {successMessage && (
                    <div style={{
                        padding: '12px 20px',
                        background: '#d4edda',
                        color: '#155724',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        fontSize: '14px'
                    }}>
                        ✅ {successMessage}
                    </div>
                )}

                {submitError && (
                    <div style={{
                        padding: '12px 20px',
                        background: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        fontSize: '14px'
                    }}>
                        ❌ Error: {(submitError as any)?.response?.data?.error || 'Failed to create task'}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Project Selection */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                            Target Project *
                        </label>
                        <select
                            required
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #ccc',
                                fontSize: '14px'
                            }}
                        >
                            <option value="">Select a project...</option>
                            {projects?.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                            Task Title *
                        </label>
                        <input
                            ref={titleRef}
                            required
                            type="text"
                            placeholder="Briefly describe the objective..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #ccc',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                            Detailed Briefing
                        </label>
                        <textarea
                            rows={5}
                            placeholder="Add execution details, requirements, or links..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #ccc',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        {/* Assignee */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                                Assigned Resource
                            </label>
                            <select
                                disabled={!canSelectAssignee || loadingMembers || !selectedProjectId}
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc',
                                    fontSize: '14px',
                                    background: !selectedProjectId ? '#f5f5f5' : '#fff'
                                }}
                            >
                                <option value={user?.id}>Current User (Me)</option>
                                {members?.filter(m => m.id !== user?.id).map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                            {!selectedProjectId && (
                                <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                                    Select a project first to see team members
                                </p>
                            )}
                        </div>

                        {/* Deadline */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                                Completion Deadline
                            </label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ccc',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: '10px', display: 'flex', gap: '15px' }}>
                        <button
                            type="submit"
                            disabled={isPending || !title.trim() || !selectedProjectId}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#667eea',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 25px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                opacity: isPending || !title.trim() || !selectedProjectId ? 0.7 : 1
                            }}
                        >
                            {isPending ? 'Syncing...' : 'Deploy Task'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/tasks')}
                            style={{
                                background: 'transparent',
                                color: '#666',
                                border: '1px solid #ddd',
                                padding: '12px 25px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Abandon Change
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
