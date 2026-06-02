/**
 * Purpose:     The /dashboard page.
 * Responsibility: Show four KPI cards:
 *                  - Total projects
 *                  - Total tasks
 *                  - Completed tasks
 *                  - Pending tasks
 *
 *                Since the API has no /api/dashboard/stats endpoint, we
 *                compute these numbers client-side by fetching the
 *                projects and tasks lists and aggregating in a
 *                `computed()` signal.
 *
 * Interactions:
 *   - ProjectService.getAll() → for "Total projects".
 *   - TaskService.getAll()    → for the three task counts.
 *   - On error, fall back to zeros and surface a banner.
 *
 * Why use `forkJoin` here?
 *   We need BOTH lists before we can compute anything. forkJoin waits
 *   for every input observable to complete and emits the last value
 *   of each as a single array. It's the cleanest "all-or-nothing"
 *   combinator in RxJS.
 */

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, LoadingSpinnerComponent, ErrorMessageComponent],
  template: `
    <section class="page">
      <header class="page-header">
        <h1>Dashboard</h1>
        <p class="muted">Live counts computed from the API.</p>
      </header>

      <app-error-message [message]="errorMessage()" />
      <app-loading-spinner [visible]="loading()" />

      <div class="grid">
        <a routerLink="/projects" class="card">
          <div class="label">Total projects</div>
          <div class="value">{{ totalProjects() | number }}</div>
        </a>

        <a routerLink="/tasks" class="card">
          <div class="label">Total tasks</div>
          <div class="value">{{ totalTasks() | number }}</div>
        </a>

        <a routerLink="/tasks" [queryParams]="{ status: 'Completed' }" class="card success">
          <div class="label">Completed tasks</div>
          <div class="value">{{ completedTasks() | number }}</div>
        </a>

        <a routerLink="/tasks" [queryParams]="{ status: 'Pending' }" class="card warning">
          <div class="label">Pending tasks</div>
          <div class="value">{{ pendingTasks() | number }}</div>
        </a>
      </div>
    </section>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: var(--space-5); }
    .page-header h1 { margin: 0 0 var(--space-1); }
    .muted { color: var(--color-muted); margin: 0; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-4);
    }
    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: var(--space-5);
      text-decoration: none;
      color: inherit;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-decoration: none; }
    .label { color: var(--color-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 32px; font-weight: 700; margin-top: var(--space-2); color: var(--color-text); }
    .card.success .value { color: var(--color-success); }
    .card.warning .value { color: var(--color-warning); }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly projectsSvc = inject(ProjectService);
  private readonly tasksSvc    = inject(TaskService);

  /** Raw fetched data. */
  private readonly _projectsCount = signal(0);
  private readonly _tasks         = signal<{ status: string }[]>([]);

  /** Aggregates — all derived via `computed` so they auto-update. */
  readonly totalProjects  = computed(() => this._projectsCount());
  readonly totalTasks     = computed(() => this._tasks().length);
  readonly completedTasks = computed(() => this._tasks().filter((t) => t.status === 'Completed').length);
  readonly pendingTasks   = computed(() => this._tasks().filter((t) => t.status === 'Pending').length);

  readonly loading      = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      projects: this.projectsSvc.getAll(),
      tasks:    this.tasksSvc.getAll()
    }).subscribe({
      next: ({ projects, tasks }) => {
        this._projectsCount.set(projects.length);
        this._tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to load dashboard data.');
        this.loading.set(false);
      }
    });
  }
}
