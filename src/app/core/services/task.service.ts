/**
 * Purpose:     All HTTP traffic for tasks.
 * Responsibility: Same pattern as ProjectService, but with optional
 *                query-string filters (projectId, assignedUserId).
 * Interactions: Called by TaskListComponent, TaskCreateComponent, and
 *                TaskEditComponent. DashboardComponent also uses
 *                getAll() to compute aggregate counts.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Task, TaskCreateRequest, TaskUpdateRequest } from '../models/task.model';
import { ErrorService } from './error.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);

  private readonly baseUrl = `${environment.apiBaseUrl}/tasks`;

  /**
   * GET /api/tasks
   * Optional filters mirror the API's [FromQuery] parameters.
   * HttpParams is built only with the keys the caller actually passed.
   */
  getAll(filters?: { projectId?: string; assignedUserId?: string }): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.projectId)      params = params.set('projectId', filters.projectId);
    if (filters?.assignedUserId) params = params.set('assignedUserId', filters.assignedUserId);

    return this.http
      .get<Task[]>(this.baseUrl, { params })
      .pipe(catchError((err) => this.fail(err)));
  }

  /** GET /api/tasks/{id} */
  getById(id: string): Observable<Task> {
    return this.http
      .get<Task>(`${this.baseUrl}/${id}`)
      .pipe(catchError((err) => this.fail(err)));
  }

  /** POST /api/tasks */
  create(req: TaskCreateRequest): Observable<Task> {
    return this.http
      .post<Task>(this.baseUrl, req)
      .pipe(catchError((err) => this.fail(err)));
  }

  /** PUT /api/tasks/{id} */
  update(id: string, req: TaskUpdateRequest): Observable<Task> {
    return this.http
      .put<Task>(`${this.baseUrl}/${id}`, req)
      .pipe(catchError((err) => this.fail(err)));
  }

  /** DELETE /api/tasks/{id} */
  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError((err) => this.fail(err)));
  }

  private fail(err: unknown) {
    this.errorService.report(err as any);
    return throwError(() => err);
  }
}
