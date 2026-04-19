import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../../api/tasks';

interface TaskCardProps {
    task: Task;
    index: number;
    onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick }) => {
    const getStatusClass = () => {
        if (task.status === 'Done') return 'chip chip-status-done';
        if (task.status === 'In Progress') return 'chip chip-status-progress';
        return 'chip chip-status-todo';
    };

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(task)}
                    className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                    style={provided.draggableProps.style}
                >
                    <div className="task-card-head">
                        <span className={getStatusClass()}>
                            {task.status}
                        </span>
                    </div>
                    <h4 className="task-card-title">{task.title}</h4>
                    <p className="task-card-description">
                        {task.description}
                    </p>
                    <div className="task-card-foot">
                        <div className="task-assignee-dot">
                            {String(task.assignee_id).charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
