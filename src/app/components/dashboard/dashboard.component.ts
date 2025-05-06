import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Goal, GoalStatus } from '../../models/goal.model';
import { GoalService } from '../../services/goal.service';
import { AuthService } from '../../services/auth.service';
import { GoalFormDialogComponent } from '../goal-form-dialog/goal-form-dialog.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  goals: Goal[] = [];
  loading = true;
  errorMessage = '';
  currentDate = new Date();
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: Array<{
    date: Date;
    goals: any[];
  }> = [];

  constructor(
    private goalService: GoalService,
    public authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadGoals();
    this.generateCalendarDays();
  }

  loadGoals(): void {
    this.loading = true;
    this.goalService.getAllGoals().subscribe({
      next: (goals: Goal[]) => {
        this.goals = goals;
        this.loading = false;
        this.generateCalendarDays();
      },
      error: (error: any) => {
        console.error('Error loading goals:', error);
        this.errorMessage = error.error?.message || 'Failed to load goals.';
        this.loading = false;
      }
    });
  }

  openGoalForm(goal?: Goal): void {
    const dialogRef = this.dialog.open(GoalFormDialogComponent, {
      width: '500px',
      data: goal
    });

    dialogRef.afterClosed().subscribe((result: Goal) => {
      console.log('Dialog result:', result);
      if (result) {
        if (goal) {
          this.goalService.updateGoal(goal.id, result).subscribe({
            next: () => {
              this.loadGoals();
              this.snackBar.open('Goal updated successfully!', 'Close', { duration: 3000 });
            },
            error: (error) => {
              this.snackBar.open(error.error?.message || 'Failed to update goal.', 'Close', { duration: 5000 });
            }
          });
        } else {
          this.goalService.createGoal(result).subscribe({
            next: () => {
              this.loadGoals();
              this.snackBar.open('Goal created successfully!', 'Close', { duration: 3000 });
            },
            error: (error) => {
              this.snackBar.open(error.error?.message || 'Failed to create goal.', 'Close', { duration: 5000 });
            }
          });
        }
      }
    });
  }

  deleteGoal(goalId: string): void {
    if (confirm('Are you sure you want to delete this goal?')) {
      this.goalService.deleteGoal(goalId).subscribe({
        next: () => {
          this.loadGoals();
          this.snackBar.open('Goal deleted successfully!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open(error.error?.message || 'Failed to delete goal.', 'Close', { duration: 5000 });
        }
      });
    }
  }

  viewGoalDetails(goalId: string): void {
    this.router.navigate(['/goals', goalId]);
  }

  getProgressPercentage(goal: Goal): number {
    if (!goal.taskCount || goal.taskCount === 0) {
      return 0;
    }
    return Math.round((goal.completedTaskCount || 0) / goal.taskCount * 100);
  }

  getGoalStatusClass(goal: Goal): string {
    if (goal.status === GoalStatus.COMPLETED) {
      return 'completed';
    }
    const progress = this.getProgressPercentage(goal);
    if (progress >= 75) {
      return 'almost-done';
    } else if (progress >= 50) {
      return 'half-way';
    } else if (progress > 0) {
      return 'in-progress';
    }
    return 'not-started';
  }

  logout(): void {
    this.authService.logout();
  }

  generateCalendarDays() {
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

    // Generate array of dates and match with goals
    this.calendarDays = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      this.calendarDays.push({
        date: new Date(d),
        goals: this.goals.filter(goal => {
          const goalDate = new Date(goal.dueDate || new Date());
          return goalDate.getDate() === d.getDate() &&
                 goalDate.getMonth() === d.getMonth() &&
                 goalDate.getFullYear() === d.getFullYear();
        })
      });
    }
  }

  previousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isSameMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }
}
