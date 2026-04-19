import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateTask } from '../../hooks/useCreateTask';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useAuth } from '../../auth/AuthContext';

interface CreateTaskModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ projectId, isOpen, onClose }) => {
    const { user } = useAuth();
    const { mutate: createTask, isPending } = useCreateTask();
    const { data: members, isLoading: loadingMembers } = useProjectMembers(projectId);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [assigneeId, setAssigneeId] = useState(user?.id || '');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setDeadline('');
            setAssigneeId(user?.id || '');
        }
    }, [isOpen, user?.id]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        createTask(
            {
                projectId,
                payload: {
                    title,
                    description,
                    deadline: deadline || undefined,
                    assignee_id: assigneeId,
                },
            },
            {
                onSuccess: () => {
                    onClose();
                },
            }
        );
    };

    const canSelectAssignee = user?.role === 'super_admin' || user?.role === 'project_manager';

    return (
        <div className="task-modal-overlay" onClick={onClose}>
            <div className="task-modal" onClick={(event) => event.stopPropagation()}>
                <div className="task-modal-header">
                    <h3>Create New Task</h3>
                    <button onClick={onClose} className="task-modal-close" type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="task-create-form">
                    <div>
                        <label className="kpi-label">Task Title</label>
                        <input
                            className="field"
                            required
                            type="text"
                            placeholder="e.g. Implement auth logic"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="kpi-label">Description</label>
                        <textarea
                            className="field-area"
                            rows={3}
                            placeholder="Provide details about the task..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="controls-row">
                        <div>
                            <label className="kpi-label">Assign To</label>
                            <select
                                className="field-select"
                                disabled={!canSelectAssignee || loadingMembers}
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                            >
                                <option value={user?.id}>Myself</option>
                                {members?.filter(m => m.id !== user?.id).map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="kpi-label">Deadline</label>
                            <input
                                className="field"
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="task-modal-footer" style={{ padding: 0, borderTop: 0 }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !title.trim()}
                            className="btn btn-primary"
                        >
                            {isPending ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
