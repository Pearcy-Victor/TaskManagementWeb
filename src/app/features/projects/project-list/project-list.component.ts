/**
 * Purpose:     The /projects page — a CRUD list view.
 * Responsibility: Fetch all projects on init, render them in a table,
 *                and let the user navigate to create/edit pages or
 *                delete a project (Admin only).
 * Interactions:
 *   - ProjectService.getAll()  → loads the list.
 *   - ProjectService.delete()  → removes a project.
 *   - Router.navigate([...])   → goes to create/edit pages.
 *   - AuthService.currentUser() → decides whether to show the delete
 *     button (only Admin can hit DELETE /api/projects/{id}).
 *
 * RxJS concepts used:
 *   - subscribe() to kick off the HTTP call and react to the result.
 *   - The "loading" + "error" + "data" pattern is the textbook way
 *     to expose an HTTP-backed resource to a template.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { isAdmin } from '../../../core/models/user.model';
import { Project } from '../../../core/models/project.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, LoadingSpinnerComponent, ErrorMessageComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Projects</h1>
        <a routerLink="/projects/create" class="primary">+ New project</a>
      </header>

      <app-error-message [message]="errorMessage()" />
      <app-loading-spinner [visible]="loading()" />

      @if (!loading() && projects().length === 0 && !errorMessage()) {
        <p class="empty">No projects yet. Create your first one!</p>
      }

      @if (projects().length > 0) {
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Tasks</th>
              <th>Created</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (p of projects(); track p.id) {
              <tr>
                <td><a [routerLink]="['/projects/edit', p.id]">{{ p.name }}</a></td>
                <td class="muted">{{ p.description || '—' }}</td>
                <td>{{ p.taskCount }}</td>
                <td>{{ p.createdAt | date:'mediumDate' }}</td>
                <td class="actions">
                  <a [routerLink]="['/projects/edit', p.id]">Edit</a>
                  @if (canDelete()) {
                    <button type="button" class="danger" (click)="onDelete(p)">Delete</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: var(--space-4); }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    h1 { margin: 0; }
    .primary {
      padding: var(--space-2) var(--space-4);
      background: var(--color-primary); color: white;
      border-radius: var(--radius);
    }
    .primary:hover { background: var(--color-primary-hover); text-decoration: none; }
    .empty { color: var(--color-muted); }
    table { width: 100%; border-collapse: collapse; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    th, td { text-align: left; padding: var(--space-3); border-bottom: 1px solid var(--color-border); }
    th { background: var(--color-bg); font-weight: 600; font-size: 12px; text-transform: uppercase; color: var(--color-muted); }
    tbody tr:last-child td { border-bottom: 0; }
    .actions { display: flex; gap: var(--space-3); align-items: center; }
    .actions a { font-size: 13px; }
    .danger {
      padding: var(--space-1) var(--space-3);
      background: transparent;
      color: var(--color-danger);
      border: 1px solid var(--color-danger);
      border-radius: var(--radius);
    }
    .danger:hover { background: var(--color-danger); color: white; }
    .muted { color: var(--color-muted); }
  `]
})
export class ProjectListComponent implements OnInit {
  private readonly projectsSvc = inject(ProjectService);
  private readonly auth        = inject(AuthService);
  private readonly router      = inject(Router);

  readonly projects      = signal<Project[]>([]);
  readonly loading       = signal(false);
  readonly errorMessage  = signal<string | null>(null);

  /** Only Admins may delete a project (the API enforces this too). */
  readonly canDelete = signal(false);

  ngOnInit(): void {
    this.canDelete.set(isAdmin(this.auth.currentUser()));
    this.loadProjects();
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.projectsSvc.getAll().subscribe({
      next: (list) => {
        this.projects.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to load projects.');
        this.loading.set(false);
      }
    });
  }

  onDelete(p: Project): void {
    if (!confirm(`Delete project "${p.name}"? This cannot be undone.`)) {
      return;
    }
    this.projectsSvc.delete(p.id).subscribe({
      next: () => {
        // Optimistic update: remove the row locally without a full reload.
        this.projects.update((list) => list.filter((x) => x.id !== p.id));
      },
      error: (err) => {
        // 403 surfaces as a generic message; the API hides specifics.
        this.errorMessage.set(err?.error?.message ?? 'You are not allowed to delete this project.');
      }
    });
  }
}
