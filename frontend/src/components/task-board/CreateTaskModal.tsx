import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Type, FileText, Loader2 } from 'lucide-react';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Create New Task</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Type size={16} className="text-blue-500" />
                            Task Title
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Implement auth logic"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <FileText size={16} className="text-blue-500" />
                            Description
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Provide details about the task..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none placeholder:text-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Assignee */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <User size={16} className="text-blue-500" />
                                Assign To
                            </label>
                            <select
                                disabled={!canSelectAssignee || loadingMembers}
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-60 cursor-pointer"
                            >
                                <option value={user?.id}>Myself</option>
                                {members?.filter(m => m.id !== user?.id).map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Deadline */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar size={16} className="text-blue-500" />
                                Deadline
                            </label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !title.trim()}
                            className="flex-[2] px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Task'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
