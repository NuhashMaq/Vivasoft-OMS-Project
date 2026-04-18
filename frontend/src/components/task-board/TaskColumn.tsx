import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from '../task-card/TaskCard';
import { Task, TaskStatus } from '../../api/tasks';

interface TaskColumnProps {
    status: TaskStatus;
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, onTaskClick }) => {
    const getHeaderColor = () => {
        switch (status) {
            case 'To Do': return '#888';
            case 'In Progress': return '#3b82f6';
            case 'Done': return '#10b981';
            default: return '#888';
        }
    };

    return (
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                padding: '12px 15px',
                background: '#fff',
                borderRadius: '8px 8px 0 0',
                border: '1px solid #ddd',
                borderBottom: `3px solid ${getHeaderColor()}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>{status}</h3>
                <span style={{ fontSize: '11px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                    {tasks.length}
                </span>
            </div>

            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                            flex: 1,
                            padding: '15px',
                            background: snapshot.isDraggingOver ? '#f0f4ff' : '#f9f9f9',
                            borderRadius: '0 0 8px 8px',
                            border: '1px solid #ddd',
                            borderTop: 'none',
                            minHeight: '400px',
                            transition: 'background 0.2s ease'
                        }}
                    >
                        {tasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                index={index}
                                onClick={onTaskClick}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
