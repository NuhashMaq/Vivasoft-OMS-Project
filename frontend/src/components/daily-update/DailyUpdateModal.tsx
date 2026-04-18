import React, { useState, useMemo } from 'react';
import { Task } from '../../api/tasks';
import { useDailyUpdate } from '../../hooks/useDailyUpdate';
import { X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface DailyUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    currentUserId: string; // Used to filter tasks for the current user
}

export const DailyUpdateModal: React.FC<DailyUpdateModalProps> = ({
    isOpen,
    onClose,
    tasks,
    currentUserId,
}) => {
    const { mutateAsync: submitDailyUpdate, isPending } = useDailyUpdate();

    const userTasks = useMemo(() => {
        return tasks.filter((task) => task.assignee_id === currentUserId && task.status !== 'Done');
    }, [tasks, currentUserId]);

    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [updates, setUpdates] = useState<Record<string, { action: 'started' | 'progressed' | 'completed', comment: string }>>({});

    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    if (!isOpen) return null;

    const toggleTaskSelection = (taskId: string) => {
        const next = new Set(selectedTasks);
        if (next.has(taskId)) {
            next.delete(taskId);
            // Optional: clear update data when deselected
            setUpdates((prev) => {
                const payload = { ...prev };
                delete payload[taskId];
                return payload;
            });
        } else {
            next.add(taskId);
            setUpdates((prev) => ({
                ...prev,
                [taskId]: { action: 'progressed', comment: '' }
            }));
        }
        setSelectedTasks(next);
    };

    const handleUpdateChange = (taskId: string, field: 'action' | 'comment', value: string) => {
        setUpdates((prev) => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value,
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTasks.size === 0) {
            setToast({ type: 'error', message: 'Please select at least one task to update.' });
            return;
        }

        const payload = {
            updates: Array.from(selectedTasks).map(taskId => ({
                task_id: taskId,
                action: updates[taskId].action,
                comment: updates[taskId].comment,
            }))
        };

        try {
            await submitDailyUpdate(payload);
            setToast({ type: 'success', message: 'Daily updates submitted successfully!' });
            setTimeout(() => {
                setToast(null);
                onClose();
            }, 1500);
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to submit updates. Please try again.' });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Submit Daily Update</h2>
                        <p className="text-sm text-gray-500 mt-1">Select the tasks you worked on today and provide updates.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-white">
                    {toast && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <p className="font-medium text-sm">{toast.message}</p>
                        </div>
                    )}

                    {userTasks.length === 0 ? (
                        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl">
                            <CheckCircle className="mx-auto text-gray-300 mb-3" size={32} />
                            <p className="text-lg font-semibold text-gray-700">All caught up!</p>
                            <p className="text-gray-400 text-sm mt-1">You have no active tasks requiring updates.</p>
                        </div>
                    ) : (
                        <form id="daily-update-form" onSubmit={handleSubmit} className="space-y-4">
                            {userTasks.map((task) => {
                                const isSelected = selectedTasks.has(task.id);
                                return (
                                    <div
                                        key={task.id}
                                        className={`border rounded-xl p-4 transition-all duration-200 ${isSelected ? 'border-blue-400 bg-blue-50/20 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="pt-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleTaskSelection(task.id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="font-semibold text-gray-800 cursor-pointer block" onClick={() => toggleTaskSelection(task.id)}>
                                                    {task.title}
                                                </label>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    {task.status}
                                                </span>

                                                {isSelected && (
                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                                        <div className="md:col-span-1">
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Action Taken</label>
                                                            <select
                                                                value={updates[task.id]?.action || 'progressed'}
                                                                onChange={(e) => handleUpdateChange(task.id, 'action', e.target.value)}
                                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-gray-700"
                                                            >
                                                                <option value="started">Started</option>
                                                                <option value="progressed">Progressed</option>
                                                                <option value="completed">Completed</option>
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Update Comment</label>
                                                            <input
                                                                type="text"
                                                                placeholder="What did you do?"
                                                                required
                                                                value={updates[task.id]?.comment || ''}
                                                                onChange={(e) => handleUpdateChange(task.id, 'comment', e.target.value)}
                                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="daily-update-form"
                        disabled={isPending || userTasks.length === 0}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Updates'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
