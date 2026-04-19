import React, { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { TaskColumn } from './TaskColumn';
import { Task, TaskStatus } from '../../api/tasks';
import { useProjectTasks } from '../../hooks/useProjectTasks';
import { useUpdateTaskStatus } from '../../hooks/useUpdateTaskStatus';
import { useAuth } from '../../auth/AuthContext';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { canCreateTasks } from '../../auth/rbac';
import './TaskBoard.css';

interface ProjectTaskBoardProps {
    projectId: string;
}

type ViewMode = 'kanban' | 'list';

export const ProjectTaskBoard: React.FC<ProjectTaskBoardProps> = ({ projectId }) => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const { data: tasks, isLoading, isError } = useProjectTasks(projectId);
    const updateStatus = useUpdateTaskStatus();

    const canCreate = canCreateTasks(user?.role);

    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        return tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tasks, searchQuery, statusFilter]);

    const groupedTasks = useMemo(() => {
        const groups: Record<TaskStatus, Task[]> = {
            'To Do': [],
            'In Progress': [],
            'Done': []
        };
        filteredTasks.forEach(task => {
            if (groups[task.status]) {
                groups[task.status].push(task);
            }
        });
        return groups;
    }, [filteredTasks]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        updateStatus.mutate({
            taskId: draggableId,
            status: destination.droppableId as TaskStatus,
            projectId,
        });
    };

    if (isLoading) return <div className="panel"><p className="muted">Loading tasks...</p></div>;
    if (isError) return <div className="panel"><p className="muted">Could not load task board.</p></div>;

    return (
        <div className="task-board-shell">
            <section className="panel board-toolbar">
                <div className="board-toolbar-group">
                    <input
                        className="field"
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select
                        className="field-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>
                </div>

                <div className="board-toolbar-group">
                    <div className="view-switch">
                        <button
                            className={`view-switch-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                            onClick={() => setViewMode('kanban')}
                        >
                            Kanban
                        </button>
                        <button
                            className={`view-switch-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            List
                        </button>
                    </div>
                    {canCreate && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setCreateModalOpen(true)}
                        >
                            + New Task
                        </button>
                    )}
                </div>
            </section>

            <div>
                {viewMode === 'kanban' ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="board-columns">
                            <TaskColumn status="To Do" tasks={groupedTasks['To Do']} onTaskClick={setSelectedTask} />
                            <TaskColumn status="In Progress" tasks={groupedTasks['In Progress']} onTaskClick={setSelectedTask} />
                            <TaskColumn status="Done" tasks={groupedTasks['Done']} onTaskClick={setSelectedTask} />
                        </div>
                    </DragDropContext>
                ) : (
                    <div className="panel data-table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Task Name</th>
                                    <th>Status</th>
                                    <th>Assignee</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id}>
                                        <td>{task.title}</td>
                                        <td>
                                            <span
                                                className={`chip ${task.status === 'Done'
                                                    ? 'chip-status-done'
                                                    : task.status === 'In Progress'
                                                        ? 'chip-status-progress'
                                                        : 'chip-status-todo'
                                                    }`}
                                            >
                                                {task.status}
                                            </span>
                                        </td>
                                        <td>{task.assignee_id}</td>
                                        <td>
                                            <button
                                                onClick={() => setSelectedTask(task)}
                                                className="btn btn-ghost"
                                                style={{ padding: '6px 12px', fontSize: 13 }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="muted">No tasks found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateTaskModal
                projectId={projectId}
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
            />

            <TaskDetailModal
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </div>
    );
};
