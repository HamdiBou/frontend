import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Task, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.css']
})
export class TaskItemComponent {
  @Input() task!: Task;
  @Output() statusToggled = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<string>();

  toggleStatus(): void {
    this.statusToggled.emit(this.task);
  }

  deleteTask(): void {
    this.taskDeleted.emit(this.task.id);
  }

  getPriorityClass(): string {
    return 'priority-' + this.task.priority.toLowerCase();
  }

  isCompleted(): boolean {
    return this.task.status === TaskStatus.DONE;
  }
}
