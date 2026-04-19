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
    const getStatusClass = () => {
        if (status === 'Done') return 'chip chip-status-done';
        if (status === 'In Progress') return 'chip chip-status-progress';
        return 'chip chip-status-todo';
    };

    return (
        <section className="task-column">
            <header className="task-column-header">
                <span className={getStatusClass()}>{status}</span>
                <span className="task-column-count">
                    {tasks.length}
                </span>
            </header>

            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`task-column-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
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
        </section>
    );
};
