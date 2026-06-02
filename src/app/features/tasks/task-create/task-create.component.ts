/**
 * Purpose:     The /tasks/create page.
 * Responsibility: Render a Reactive Form (title, description, status,
 *                priority, project, assignedUserId), call
 *                TaskService.create() on submit, and navigate to /tasks
 *                on success.
 * Interactions:
 *   - ProjectService.getAll() → populates the project dropdown.
 *   - TaskService.create(form.value) → POST /api/tasks.
 *
 * Demonstrates how to consume a `readonly` array of string literals
 * (TASK_STATUSES, TASK_PRIORITIES) to drive <select> options.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../../core/models/task.model';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ErrorMessageComponent],
  template: `
    <section class="page">
      <a routerLink="/tasks" class="back">← Back to tasks</a>
      <h1>New task</h1>

      <form class="card" [formGroup]="form" (ngSubmit)="onSubmit()">
        <app-error-message [message]="errorMessage()" />

        <label>
          <span>Title</span>
          <input type="text" formControlName="title" maxlength="200" />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <div class="field-error">Title is required.</div>
          }
        </label>

        <label>
          <span>Description (optional)</span>
          <textarea formControlName="description" rows="3" maxlength="1000"></textarea>
        </label>

        <div class="row">
          <label>
            <span>Status</span>
            <select formControlName="status">
              @for (s of statuses; track s) { <option [ngValue]="s">{{ s }}</option> }
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select formControlName="priority">
              @for (p of priorities; track p) { <option [ngValue]="p">{{ p }}</option> }
            </select>
          </label>
        </div>

        <label>
          <span>Project</span>
          <select formControlName="projectId">
            <option [ngValue]="''" disabled>— select a project —</option>
            @for (proj of projects(); track proj.id) {
              <option [ngValue]="proj.id">{{ proj.name }}</option>
            }
          </select>
          @if (form.controls.projectId.touched && form.controls.projectId.errors?.['required']) {
            <div class="field-error">Project is required.</div>
          }
        </label>

        <div class="row">
          <button type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Creating…' : 'Create task' }}
          </button>
          <a routerLink="/tasks" class="cancel">Cancel</a>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .page { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-4); }
    .back { color: var(--color-muted); font-size: 13px; }
    h1 { margin: 0; }
    .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
    label { display: flex; flex-direction: column; gap: var(--space-1); font-size: 13px; flex: 1; }
    input, textarea, select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      font-family: inherit;
    }
    .row { display: flex; gap: var(--space-3); }
    button {
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary); color: white; border: 0;
      border-radius: var(--radius); font-weight: 600;
    }
    button:disabled { background: var(--color-muted); cursor: not-allowed; }
    .cancel { color: var(--color-muted); align-self: center; }
  `]
})
export class TaskCreateComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly tasksSvc    = inject(TaskService);
  private readonly projectsSvc = inject(ProjectService);
  private readonly router      = inject(Router);

  readonly statuses   = TASK_STATUSES;
  readonly priorities = TASK_PRIORITIES;

  readonly projects     = signal<Project[]>([]);
  readonly loading      = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    title:       this.fb.control('', [Validators.required, Validators.maxLength(200)]),
    description: this.fb.control(''),
    status:      this.fb.control<'Pending' | 'InProgress' | 'Completed'>('Pending'),
    priority:    this.fb.control<'Low' | 'Medium' | 'High'>('Medium'),
    projectId:   this.fb.control('', [Validators.required])
  });

  ngOnInit(): void {
    this.projectsSvc.getAll().subscribe({
      next: (list) => this.projects.set(list),
      error: () => this.errorMessage.set('Failed to load projects.')
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    this.tasksSvc.create(this.form.getRawValue() as any)
      .subscribe({
        next: () => { this.loading.set(false); this.router.navigate(['/tasks']); },
        error: (err) => { this.loading.set(false); this.errorMessage.set(err?.error?.message ?? 'Failed to create task.'); }
      });
  }
}
