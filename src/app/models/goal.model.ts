export enum GoalStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  userId: string;
  dueDate?: Date | string;
  completedAt?: Date | string;
  createdAt?: Date;
  updatedAt?: Date;
  taskCount?: number;
  completedTaskCount?: number;
}
