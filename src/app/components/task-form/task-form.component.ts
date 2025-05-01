import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Task, TaskPriority, TaskStatus } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  templateUrl: '../task-form/task-form.component.html',
  styleUrls: ['../task-form/task-form.component.css']
})
export class TaskFormComponent implements OnInit {
  @Input() goalId!: string;
  @Input() task?: Task;
  @Output() formSubmitted = new EventEmitter<Partial<Task>>();
  @Output() formCancelled = new EventEmitter<void>();

  taskForm!: FormGroup;
  priorities = Object.values(TaskPriority);
  isEditMode = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.isEditMode = !!this.task;
    this.initForm();
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required]],
      description: [this.task?.description || '', [Validators.required]],
      priority: [this.task?.priority || TaskPriority.MEDIUM],
      dueDate: [this.task?.dueDate || null]
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      return;
    }

    const formValue = this.taskForm.value;

    const taskData: Partial<Task> = {
      ...formValue,
      goalId: this.goalId,
      status: this.task?.status || TaskStatus.TODO
    };

    if (this.isEditMode && this.task) {
      taskData.id = this.task.id;
    }

    this.formSubmitted.emit(taskData);
  }

  onCancel(): void {
    this.formCancelled.emit();
  }
}
