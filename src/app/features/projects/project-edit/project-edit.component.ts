/**
 * Purpose:     The /projects/edit/:id page.
 * Responsibility: Load the project identified by the :id URL parameter,
 *                pre-fill a Reactive Form, validate, and call
 *                ProjectService.update() on submit.
 * Interactions:
 *   - ActivatedRoute.paramMap → reads the :id segment from the URL.
 *   - ProjectService.getById(id) → loads the project (the HTTP call).
 *   - ProjectService.update(id, form.value) → PUT /api/projects/{id}.
 *
 * RxJS concept introduced: `switchMap`.
 *   When we read a route param we want to fire a NEW HTTP request
 *   every time the param changes — and CANCEL the previous request
 *   if it hasn't completed yet. switchMap does exactly that: it
 *   subscribes to the new inner Observable and unsubscribes from
 *   the previous one. This avoids a race where an older, slower
 *   request resolves AFTER a newer, faster one and overwrites the
 *   form with stale data.
 *
 * Angular 20 withComponentInputBinding:
 *   Because we enabled `withComponentInputBinding()` in app.config.ts,
 *   the route param `:id` is also exposed as an `@Input() id` here.
 *   We still use ActivatedRoute below to demonstrate the classic
 *   pattern, but you can replace it with `input<string>('id')`.
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { ProjectService } from '../../../core/services/project.service';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  template: `
    <section class="page">
      <a routerLink="/projects" class="back">← Back to projects</a>
      <h1>Edit project</h1>

      <app-error-message [message]="errorMessage()" />
      <app-loading-spinner [visible]="loading()" />

      <form class="card" [formGroup]="form" (ngSubmit)="onSubmit()">
        <label>
          <span>Name</span>
          <input type="text" formControlName="name" maxlength="100" />
          @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
            <div class="field-error">Name is required.</div>
          }
        </label>

        <label>
          <span>Description (optional)</span>
          <textarea formControlName="description" rows="4" maxlength="500"></textarea>
        </label>

        <div class="row">
          <button type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Saving…' : 'Save changes' }}
          </button>
          <a routerLink="/projects" class="cancel">Cancel</a>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-4); }
    .back { color: var(--color-muted); font-size: 13px; }
    h1 { margin: 0; }
    .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
    label { display: flex; flex-direction: column; gap: var(--space-1); font-size: 13px; }
    input, textarea {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      font-family: inherit;
    }
    input:focus, textarea:focus { outline: 2px solid var(--color-primary); outline-offset: -1px; }
    .row { display: flex; align-items: center; gap: var(--space-3); }
    button {
      padding: var(--space-3) var(--space-4);
      background: var(--color-primary); color: white; border: 0;
      border-radius: var(--radius); font-weight: 600;
    }
    button:disabled { background: var(--color-muted); cursor: not-allowed; }
    .cancel { color: var(--color-muted); }
  `]
})
export class ProjectEditComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly projectsSvc = inject(ProjectService);
  private readonly route       = inject(ActivatedRoute);
  private readonly router      = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonGroup({
    name: this.fb.nonGroup('', [Validators.required, Validators.maxLength(100)]),
    description: this.fb.control('')
  });

  ngOnInit(): void {
    // switchMap demo: when :id changes, fire a new GET and cancel the old one.
    this.route.paramMap
      .pipe(switchMap((params) => this.projectsSvc.getById(params.get('id')!)))
      .subscribe({
        next: (p) => this.form.patchValue({ name: p.name, description: p.description ?? '' }),
        error: (err) => this.errorMessage.set(err?.error?.message ?? 'Failed to load project.')
      });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.errorMessage.set(null);

    this.projectsSvc.update(id, this.form.getRawValue() as { name: string; description?: string })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Failed to save changes.');
        }
      });
  }
}
