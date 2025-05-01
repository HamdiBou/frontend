import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Goal, GoalStatus } from '../../models/goal.model';

interface DialogData {
  goal?: Goal;
}

@Component({
  selector: 'app-goal-form-dialog',
  templateUrl: './goal-form-dialog.component.html',
  styleUrls: ['./goal-form-dialog.component.css']
})
export class GoalFormDialogComponent implements OnInit {
  goalForm!: FormGroup;
  isEditMode = false;
  dialogTitle = 'Add New Goal';
  submitButtonText = 'Create Goal';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<GoalFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit(): void {
    this.isEditMode = !!this.data?.goal;

    if (this.isEditMode) {
      this.dialogTitle = 'Edit Goal';
      this.submitButtonText = 'Update Goal';
    }

    this.initForm();
  }

  initForm(): void {
    const goal = this.data?.goal;

    this.goalForm = this.fb.group({
      title: [goal?.title || '', [Validators.required, Validators.maxLength(100)]],
      description: [goal?.description || '', [Validators.required]],
      dueDate: [goal?.dueDate || null]
    });
  }

  onSubmit(): void {
    if (this.goalForm.invalid) {
      return;
    }

    const formValue = this.goalForm.value;

    const goalData: Partial<Goal> = {
      ...formValue,
      status: GoalStatus.IN_PROGRESS
    };

    if (this.isEditMode && this.data.goal) {
      goalData.id = this.data.goal.id;
    }

    this.dialogRef.close(goalData);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
