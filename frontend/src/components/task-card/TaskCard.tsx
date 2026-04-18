import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../../api/tasks';

interface TaskCardProps {
    task: Task;
    index: number;
    onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
    const getStatusColor = () => {
        switch (task.status) {
            case 'To Do': return '#888';
            case 'In Progress': return '#3b82f6';
            case 'Done': return '#10b981';
            default: return '#888';
        }
    };

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(task)}
                    style={{
                        userSelect: 'none',
                        padding: '15px',
                        margin: '0 0 12px 0',
                        backgroundColor: snapshot.isDragging ? '#fff' : '#fff',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        borderLeft: `4px solid ${getStatusColor()}`,
                        boxShadow: snapshot.isDragging
                            ? '0 5px 15px rgba(0,0,0,0.15)'
                            : '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'box-shadow 0.2s ease',
                        cursor: 'pointer',
                        ...provided.draggableProps.style,
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            color: getStatusColor(),
                            background: `${getStatusColor()}15`,
                            padding: '2px 6px',
                            borderRadius: '4px'
                        }}>
                            {task.status}
                        </span>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>{task.title}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                        {task.description}
                    </p>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#667eea', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {task.assignee_id.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
