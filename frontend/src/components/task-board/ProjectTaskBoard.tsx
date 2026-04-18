import React, { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { TaskColumn } from './TaskColumn';
import { Task, TaskStatus } from '../../api/tasks';
import { useProjectTasks } from '../../hooks/useProjectTasks';
import { useUpdateTaskStatus } from '../../hooks/useUpdateTaskStatus';
import { useAuth } from '../../auth/AuthContext';
import { TaskDetailModal } from './TaskDetailModal';

interface ProjectTaskBoardProps {
    projectId: string;
}

const canCreateTasks = (role?: string) => role === 'project_manager' || role === 'super_admin';

type ViewMode = 'kanban' | 'list';

export const ProjectTaskBoard: React.FC<ProjectTaskBoardProps> = ({ projectId }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');

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

    if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading tasks...</div>;
    if (isError) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error loading tasks.</div>;

    return (
        <div className="task-board-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Control Bar */}
            <div style={{
                padding: '20px',
                background: '#fff',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', width: '250px' }}
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ background: '#f0f0f0', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                        <button
                            onClick={() => setViewMode('kanban')}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                background: viewMode === 'kanban' ? '#fff' : 'transparent',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                boxShadow: viewMode === 'kanban' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                background: viewMode === 'list' ? '#fff' : 'transparent',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            List
                        </button>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => navigate('/tasks/new')}
                            style={{
                                background: '#667eea',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            + New Task
                        </button>
                    )}
                </div>
            </div>

            {/* Board/List Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {viewMode === 'kanban' ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div style={{ display: 'flex', gap: '20px', height: '100%', overflowX: 'auto', paddingBottom: '10px' }}>
                            <TaskColumn status="To Do" tasks={groupedTasks['To Do']} onTaskClick={setSelectedTask} />
                            <TaskColumn status="In Progress" tasks={groupedTasks['In Progress']} onTaskClick={setSelectedTask} />
                            <TaskColumn status="Done" tasks={groupedTasks['Done']} onTaskClick={setSelectedTask} />
                        </div>
                    </DragDropContext>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
                                <tr>
                                    <th style={{ padding: '12px 15px', fontSize: '13px', fontWeight: '600' }}>Task Name</th>
                                    <th style={{ padding: '12px 15px', fontSize: '13px', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '12px 15px', fontSize: '13px', fontWeight: '600' }}>Assignee</th>
                                    <th style={{ padding: '12px 15px', fontSize: '13px', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px 15px', fontSize: '14px' }}>{task.title}</td>
                                        <td style={{ padding: '12px 15px' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '2px 8px',
                                                borderRadius: '20px',
                                                background: task.status === 'Done' ? '#dcfce7' : task.status === 'In Progress' ? '#dbeafe' : '#f3f4f6',
                                                color: task.status === 'Done' ? '#166534' : task.status === 'In Progress' ? '#1e40af' : '#4b5563'
                                            }}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 15px', fontSize: '14px' }}>{task.assignee_id}</td>
                                        <td style={{ padding: '12px 15px' }}>
                                            <button
                                                onClick={() => setSelectedTask(task)}
                                                style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '13px' }}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#888' }}>No tasks found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <TaskDetailModal
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
            />
        </div>
    );
};
