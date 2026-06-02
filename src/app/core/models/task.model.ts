/**
 * Purpose:     Task-related shapes.
 * Responsibility: Mirror the API's TaskResponse / TaskCreateRequest /
 *                TaskUpdateRequest DTOs, plus the Status/Priority enums.
 * Interactions: Used by TaskService and all three task feature components.
 *
 * Why string literal unions for enums?
 *   The .NET backend uses JsonStringEnumConverter, so the JSON wire format
 *   is the enum NAME (e.g. "Pending"), not the integer value (0). A
 *   string-literal union (`'Pending' | 'InProgress' | 'Completed'`)
 *   matches that wire format directly — no extra mapping is needed in
 *   the service layer.
 */

export type TaskStatus = 'Pending' | 'InProgress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

/** All possible status values, in display order, for <select> dropdowns. */
export const TASK_STATUSES: readonly TaskStatus[] = [
  'Pending',
  'InProgress',
  'Completed'
] as const;

/** All possible priority values, in display order, for <select> dropdowns. */
export const TASK_PRIORITIES: readonly TaskPriority[] = [
  'Low',
  'Medium',
  'High'
] as const;

/** GET /api/tasks and /api/tasks/{id} */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignedUserId?: string;
  assignedUsername?: string;
  createdAt: string;
}

/** POST /api/tasks */
export interface TaskCreateRequest {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignedUserId?: string;
}

/**
 * PUT /api/tasks/{id}
 * NOTE: projectId is intentionally NOT updatable here. The API does
 * not allow moving a task between projects via PUT — that would be
 * a separate operation in a real-world app.
 */
export interface TaskUpdateRequest {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedUserId?: string;
}
