/**
 * Purpose:     All HTTP traffic for projects.
 * Responsibility: Encapsulate the URL, method, and payload shape for every
 *                /api/projects/* call. Components call these methods
 *                instead of HttpClient directly.
 * Interactions: Called by ProjectListComponent, ProjectCreateComponent,
 *                and ProjectEditComponent. Surfaces errors via ErrorService.
 *
 * Why this lives in a service (and not in a component):
 *   - Centralises the API base URL and path conventions.
 *   - Makes the same calls trivially reusable from a future feature
 *     (e.g. a dashboard widget) without duplicating the URL.
 *   - Keeps components thin and focused on presentation.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../models/project.model';
import { ErrorService } from './error.service';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);

  private readonly baseUrl = `${environment.apiBaseUrl}/projects`;

  /** GET /api/projects */
  getAll(): Observable<Project[]> {
    return this.http
      .get<Project[]>(this.baseUrl)
      .pipe(catchError((err) => this.fail(err)));
  }

  /** GET /api/projects/{id} */
  getById(id: string): Observable<Project> {
    return this.http
      .get<Project>(`${this.baseUrl}/${id}`)
      .pipe(catchError((err) => this.fail(err)));
  }

  /** POST /api/projects */
  create(req: ProjectCreateRequest): Observable<Project> {
    return this.http
      .post<Project>(this.baseUrl, req)
      .pipe(catchError((err) => this.fail(err)));
  }

  /** PUT /api/projects/{id} */
  update(id: string, req: ProjectUpdateRequest): Observable<Project> {
    return this.http
      .put<Project>(`${this.baseUrl}/${id}`, req)
      .pipe(catchError((err) => this.fail(err)));
  }

  /** DELETE /api/projects/{id} — Admin role required. */
  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError((err) => this.fail(err)));
  }

  /** Centralised error reporting; re-throw so callers can still react. */
  private fail(err: unknown) {
    // The interceptor function is not available here (it is a class),
    // so we call the error service directly.
    this.errorService.report(err as any);
    return throwError(() => err);
  }
}
