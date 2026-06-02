/**
 * Purpose:     The /projects/create page.
 * Responsibility: Render a Reactive Form for a new project, validate it,
 *                call ProjectService.create() on submit, and navigate
 *                back to /projects on success.
 * Interactions:
 *   - ProjectService.create() → POST /api/projects.
 *   - Router.navigate(['/projects']) on success.
 *
 * Form anatomy (worth memorising):
 *   - this.fb.nonGroup({...}) returns a FormGroup. Inside, each
 *     FormControl is itself a `this.fb.nonGroup(initialValue, [validators])`.
 *   - [formGroup]="form" on the <form> wires the two together.
 *   - formControlName="name" on each <input> binds that input to the
 *     named control. The names must match the keys in the FormGroup.
 *   - form.invalid is true if ANY control is invalid.
 */

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ProjectService } from '../../../core/services/project.service';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  template: `
    <section class="page">
      <a routerLink="/projects" class="back">← Back to projects</a>
      <h1>New project</h1>

      <form class="card" [formGroup]="form" (ngSubmit)="onSubmit()">
        <app-error-message [message]="errorMessage()" />

        <label>
          <span>Name</span>
          <input type="text" formControlName="name" maxlength="100" />
          @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
            <div class="field-error">Name is required.</div>
          }
          @if (form.controls.name.errors?.['maxlength']) {
            <div class="field-error">Name must be 100 characters or fewer.</div>
          }
        </label>

        <label>
          <span>Description (optional)</span>
          <textarea formControlName="description" rows="4" maxlength="500"></textarea>
        </label>

        <div class="row">
          <button type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Creating…' : 'Create project' }}
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
export class ProjectCreateComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly projectsSvc = inject(ProjectService);
  private readonly router      = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonGroup({
    name: this.fb.nonGroup('', [Validators.required, Validators.maxLength(100)]),
    description: this.fb.control('')
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.projectsSvc.create(this.form.getRawValue() as { name: string; description?: string })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Failed to create project.');
        }
      });
  }
}
