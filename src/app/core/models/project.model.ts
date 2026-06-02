/**
 * Purpose:     Project-related shapes.
 * Responsibility: Mirror the API's ProjectResponse / ProjectCreateRequest /
 *                ProjectUpdateRequest DTOs.
 * Interactions: Used by ProjectService and all three project feature
 *                components (list, create, edit).
 */

/** GET /api/projects and /api/projects/{id} — what the server returns. */
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  taskCount: number;
}

/** POST /api/projects — what we send. */
export interface ProjectCreateRequest {
  name: string;
  description?: string;
}

/** PUT /api/projects/{id} — what we send. */
export interface ProjectUpdateRequest {
  name: string;
  description?: string;
}
