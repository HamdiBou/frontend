import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Goal } from '../../models/goal.model';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { GoalService } from '../../services/goal.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { GoalFormDialogComponent } from '../goal-form-dialog/goal-form-dialog.component';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-goal-details',
  templateUrl: './goal-details.component.html',
  styleUrls: ['./goal-details.component.css']
})
export class GoalDetailsComponent implements OnInit {
  goal: Goal | null = null;
  tasks: Task[] = [];
  loading = true;
  errorMessage = '';
  isAddingTask = false;
  newTask = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: null
  };

  // Make enums available to template
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private goalService: GoalService,
    private taskService: TaskService,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const goalId = this.route.snapshot.paramMap.get('id');
    if (goalId) {
      this.loadGoal(goalId);
      this.loadTasks();
    }
  }

  loadGoal(goalId: string): void {
    this.loading = true;
    this.goalService.getGoalById(goalId).subscribe({
      next: (goal: Goal) => {
        this.goal = goal;
      },
      error: (error: any) => {
        console.error('Error loading goal:', error);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getAllTasks().subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks.filter(task => task.goalId === this.goal?.id);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    });
  }

  openEditGoalForm(): void {
    if (!this.goal) return;

    const dialogRef = this.dialog.open(GoalFormDialogComponent, {
      width: '500px',
      data: { goal: this.goal }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateGoal(result);
        this.snackBar.open('Goal updated successfully!', 'Close', { duration: 3000 });
      }
    });
  }

  deleteGoal(): void {
    if (!this.goal || !confirm('Are you sure you want to delete this goal?')) return;

    this.goalService.deleteGoal(this.goal.id).subscribe({
      next: () => {
        this.snackBar.open('Goal deleted successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'Failed to delete goal.', 'Close', { duration: 5000 });
      }
    });
  }

  toggleAddTask(): void {
    this.isAddingTask = !this.isAddingTask;
    if (!this.isAddingTask) {
      this.resetNewTask();
    }
  }

  resetNewTask(): void {
    this.newTask = {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: null
    };
  }

  addTask(): void {
    if (!this.goal || !this.authService.currentUserValue) return;

    const task: Task = {
      id: '', // Will be set by the backend
      title: this.newTask.title,
      description: this.newTask.description,
      priority: this.newTask.priority as TaskPriority,
      dueDate: this.newTask.dueDate,
      goalId: this.goal.id,
      userId: this.authService.currentUserValue.id,
      status: TaskStatus.TODO,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.taskService.createTask(task).subscribe({
      next: (createdTask: Task) => {
        this.tasks.push(createdTask);
        this.snackBar.open('Task added successfully!', 'Close', { duration: 3000 });
        this.isAddingTask = false;
        this.resetNewTask();
      },
      error: (error: any) => {
        console.error('Error creating task:', error);
        this.snackBar.open(error.error?.message || 'Failed to add task.', 'Close', { duration: 5000 });
      }
    });
  }

  toggleTaskStatus(task: Task): void {
    const updatedTask = {
      ...task,
      status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
    };

    this.taskService.updateTask(task.id, updatedTask).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error: any) => {
        console.error('Error updating task:', error);
        this.snackBar.open(error.error?.message || 'Failed to update task.', 'Close', { duration: 5000 });
      }
    });
  }

  deleteTask(taskId: string): void {
    if (!this.goal || !confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.snackBar.open('Task deleted successfully!', 'Close', { duration: 3000 });
      },
      error: (error: any) => {
        console.error('Error deleting task:', error);
        this.snackBar.open(error.error?.message || 'Failed to delete task.', 'Close', { duration: 5000 });
      }
    });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  getCompletedTasks(): Task[] {
    return this.tasks.filter(task => task.status === TaskStatus.DONE);
  }

  getPendingTasks(): Task[] {
    return this.tasks.filter(task => task.status !== TaskStatus.DONE);
  }

  updateGoal(goal: Goal): void {
    if (!this.goal) return;

    this.goalService.updateGoal(this.goal.id, goal).subscribe({
      next: (updatedGoal: Goal) => {
        this.goal = updatedGoal;
      },
      error: (error: any) => {
        console.error('Error updating goal:', error);
      }
    });
  }

  openTaskForm(): void {
    if (!this.goal) return;

    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '500px',
      data: { goalId: this.goal.id }
    });

    dialogRef.afterClosed().subscribe((result: Task) => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  updateTask(task: Task): void {
    this.taskService.updateTask(task.id, task).subscribe({
      next: (updatedTask: Task) => {
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
      },
      error: (error: any) => {
        console.error('Error updating task:', error);
      }
    });
  }
}
