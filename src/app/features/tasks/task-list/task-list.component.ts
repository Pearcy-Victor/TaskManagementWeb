/**
 * Purpose:     The /tasks page — a CRUD list view with filters.
 * Responsibility: Fetch all tasks (optionally filtered by project /
 *                status), render them in a table, and let the user
 *                navigate to create/edit pages or delete a task.
 * Interactions:
 *   - TaskService.getAll({ projectId }) → loads the list.
 *   - ProjectService.getAll() → populates the project filter dropdown.
 *   - TaskService.delete() → removes a task.
 *
 * This component demonstrates `map()` (used in `applyFilters` to derive
 * the filtered list from the raw list + the user's filter selections).
 */

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { Task, TASK_STATUSES, TaskStatus } from '../../../core/models/task.model';
import { Project } from '../../../core/models/project.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, LoadingSpinnerComponent, ErrorMessageComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Tasks</h1>
        <a routerLink="/tasks/create" class="primary">+ New task</a>
      </header>

      <div class="filters">
        <label>
          <span>Project</span>
          <select [(ngModel)]="projectFilter" (ngModelChange)="onProjectFilterChange()">
            <option [ngValue]="''">All projects</option>
            @for (p of projects(); track p.id) {
              <option [ngValue]="p.id">{{ p.name }}</option>
            }
          </select>
        </label>

        <label>
          <span>Status</span>
          <select [(ngModel)]="statusFilter" (ngModelChange)="onStatusFilterChange()">
            <option [ngValue]="''">All statuses</option>
            @for (s of statuses; track s) {
              <option [ngValue]="s">{{ s }}</option>
            }
          </select>
        </label>
      </div>

      <app-error-message [message]="errorMessage()" />
      <app-loading-spinner [visible]="loading()" />

      @if (!loading() && filteredTasks().length === 0 && !errorMessage()) {
        <p class="empty">No tasks match the current filters.</p>
      }

      @if (filteredTasks().length > 0) {
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned to</th>
              <th>Created</th>
              <th class="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (t of filteredTasks(); track t.id) {
              <tr>
                <td><a [routerLink]="['/tasks/edit', t.id]">{{ t.title }}</a></td>
                <td><span class="pill" [class]="statusClass(t.status)">{{ t.status }}</span></td>
                <td><span class="pill" [class]="priorityClass(t.priority)">{{ t.priority }}</span></td>
                <td>{{ t.assignedUsername || '—' }}</td>
                <td>{{ t.createdAt | date:'mediumDate' }}</td>
                <td class="actions">
                  <a [routerLink]="['/tasks/edit', t.id]">Edit</a>
                  <button type="button" class="danger" (click)="onDelete(t)">Delete</button>
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
    .primary { padding: var(--space-2) var(--space-4); background: var(--color-primary); color: white; border-radius: var(--radius); }
    .primary:hover { background: var(--color-primary-hover); text-decoration: none; }
    .filters { display: flex; gap: var(--space-4); }
    .filters label { display: flex; flex-direction: column; gap: var(--space-1); font-size: 12px; color: var(--color-muted); }
    .filters select { padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius); }
    .empty { color: var(--color-muted); }
    table { width: 100%; border-collapse: collapse; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    th, td { text-align: left; padding: var(--space-3); border-bottom: 1px solid var(--color-border); }
    th { background: var(--color-bg); font-weight: 600; font-size: 12px; text-transform: uppercase; color: var(--color-muted); }
    tbody tr:last-child td { border-bottom: 0; }
    .actions { display: flex; gap: var(--space-3); align-items: center; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: var(--color-bg); }
    .pill.s-pending  { background: #fff5d6; color: var(--color-warning); }
    .pill.s-progress { background: #dbeafe; color: var(--color-primary); }
    .pill.s-done     { background: #d4edda; color: var(--color-success); }
    .pill.p-low      { background: var(--color-bg); color: var(--color-muted); }
    .pill.p-medium   { background: #dbeafe; color: var(--color-primary); }
    .pill.p-high     { background: #fdecea; color: var(--color-danger); }
    .danger {
      padding: var(--space-1) var(--space-3);
      background: transparent; color: var(--color-danger);
      border: 1px solid var(--color-danger); border-radius: var(--radius);
    }
    .danger:hover { background: var(--color-danger); color: white; }
  `]
})
export class TaskListComponent implements OnInit {
  private readonly tasksSvc    = inject(TaskService);
  private readonly projectsSvc = inject(ProjectService);
  private readonly router      = inject(Router);

  readonly statuses = TASK_STATUSES;

  readonly projects     = signal<Project[]>([]);
  readonly tasks        = signal<Task[]>([]);
  readonly loading      = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Two-way bound filter inputs. */
  projectFilter = '';
  statusFilter: TaskStatus | '' = '';

  /**
   * `computed()` recomputes whenever the underlying signals change.
   * Pure derivation — no HTTP — so it's instant.
   */
  readonly filteredTasks = computed(() => {
    const list = this.tasks();
    const proj = this.projectFilter;
    const stat = this.statusFilter;
    return list.filter((t) =>
      (!proj || t.projectId === proj) &&
      (!stat || t.status === stat)
    );
  });

  ngOnInit(): void {
    this.loadProjects();
    this.loadTasks();
  }

  private loadProjects(): void {
    this.projectsSvc.getAll().subscribe({
      next: (list) => this.projects.set(list),
      error: () => { /* non-fatal; filter dropdown just stays empty */ }
    });
  }

  private loadTasks(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.tasksSvc.getAll().subscribe({
      next: (list) => { this.tasks.set(list); this.loading.set(false); },
      error: (err) => { this.errorMessage.set(err?.error?.message ?? 'Failed to load tasks.'); this.loading.set(false); }
    });
  }

  onProjectFilterChange(): void { /* filteredTasks is a computed signal, so it updates automatically */ }
  onStatusFilterChange(): void  { /* same */ }

  statusClass(s: TaskStatus): string {
    return s === 'Pending' ? 's-pending' : s === 'InProgress' ? 's-progress' : 's-done';
  }
  priorityClass(p: string): string {
    return p === 'Low' ? 'p-low' : p === 'Medium' ? 'p-medium' : 'p-high';
  }

  onDelete(t: Task): void {
    if (!confirm(`Delete task "${t.title}"?`)) return;
    this.tasksSvc.delete(t.id).subscribe({
      next: () => this.tasks.update((list) => list.filter((x) => x.id !== t.id)),
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Failed to delete task.')
    });
  }
}
