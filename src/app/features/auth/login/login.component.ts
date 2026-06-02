/**
 * Purpose:     The /login page.
 * Responsibility: Render a Reactive Form (userName + password), validate
 *                the input client-side, call AuthService.login(), and
 *                navigate to /dashboard on success.
 * Interactions:
 *   - AuthService.login() performs the HTTP POST.
 *   - ErrorService / HttpErrorResponse surface API errors as a string.
 *   - Router redirects the user on success.
 *
 * Reactive Forms primer:
 *   - FormGroup: a container for multiple FormControls.
 *   - FormControl: a single input field; tracks value + validity.
 *   - FormBuilder.nonGroup: a syntactic shortcut for `new FormControl(...)`.
 *   - Validators.required: rejects empty strings.
 *   - Validators.minLength(n): rejects strings shorter than n.
 *   - Validators.email: rejects strings that don't look like an email
 *     (we use it on the register form, not here).
 *
 * RxJS primer (used below):
 *   - subscribe(): kick off the Observable. We pass a `next` handler
 *     (success) and an `error` handler (failure).
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  template: `
    <div class="page">
      <form class="card" [formGroup]="form" (ngSubmit)="onSubmit()">
        <h1>Log in</h1>
        <p class="muted">Use <code>admin / Admin&#64;123</code> to try it out.</p>

        <app-error-message [message]="errorMessage()" />

        <label>
          <span>Username</span>
          <input type="text" formControlName="userName" autocomplete="username" />
          @if (form.controls.userName.touched && form.controls.userName.errors?.['required']) {
            <div class="field-error">Username is required.</div>
          }
        </label>

        <label>
          <span>Password</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
          @if (form.controls.password.touched && form.controls.password.errors?.['required']) {
            <div class="field-error">Password is required.</div>
          }
        </label>

        <button type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Signing in…' : 'Sign in' }}
        </button>

        <app-loading-spinner [visible]="loading()" />

        <p class="muted">No account? <a routerLink="/register">Register here</a>.</p>
      </form>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-bg);
      padding: var(--space-5);
    }
    .card {
      width: 100%; max-width: 380px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: var(--space-6);
      display: flex; flex-direction: column; gap: var(--space-4);
    }
    h1 { margin: 0 0 var(--space-2); }
    .muted { color: var(--color-muted); margin: 0; }
    label { display: flex; flex-direction: column; gap: var(--space-1); font-size: 13px; }
    input {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
    }
    input:focus { outline: 2px solid var(--color-primary); outline-offset: -1px; }
    button {
      padding: var(--space-3);
      background: var(--color-primary);
      color: white;
      border: 0;
      border-radius: var(--radius);
      font-weight: 600;
    }
    button:disabled { background: var(--color-muted); cursor: not-allowed; }
    code { background: var(--color-bg); padding: 1px 4px; border-radius: 3px; }
  `]
})
export class LoginComponent {
  private readonly fb        = inject(FormBuilder);
  private readonly auth      = inject(AuthService);
  private readonly router    = inject(Router);
  private readonly route     = inject(ActivatedRoute);

  /** Loading flag — drives both the button label and the spinner. */
  readonly loading = signal(false);
  /** Latest error message, if any. */
  readonly errorMessage = signal<string | null>(null);

  /**
   * FormGroup definition. FormBuilder.nonGroup is shorthand for
   *   new FormControl('', { nonGroup: [Validators.required] })
   * The first argument is the initial value; the second is the
   * synchronous validators array.
   */
  readonly form = this.fb.nonGroup({
    userName: this.fb.nonGroup('', [Validators.required]),
    password: this.fb.nonGroup('', [Validators.required, Validators.minLength(3)])
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.form.getRawValue() as { userName: string; password: string })
      .subscribe({
        next: () => {
          this.loading.set(false);
          // Honour the returnUrl if the guard set one, otherwise go to /dashboard.
          const ret = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
          this.router.navigateByUrl(ret);
        },
        error: (err) => {
          this.loading.set(false);
          // err is an HttpErrorResponse; we already centralised extraction
          // in ErrorService, so just re-use it.
          this.errorMessage.set(err?.error?.message ?? 'Login failed.');
        }
      });
  }
}
