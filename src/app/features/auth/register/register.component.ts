/**
 * Purpose:     The /register page.
 * Responsibility: Sign up a new user. Demonstrates `Validators.email`
 *                and `Validators.minLength`, both of which we leave
 *                out of the login form (login only needs a non-empty
 *                userName + password to match the API's LoginRequest).
 * Interactions:
 *   - AuthService.register() performs the HTTP POST.
 *   - On success, AuthService.persistSession() stores the token and
 *     signals currentUser, exactly like login() does.
 *   - Router redirects to /dashboard.
 *
 * New-concept checklist:
 *   - Validators.email: regex-based email-shape check.
 *   - Validators.minLength(6): enforces the API's password rule.
 *   - Custom inline error messages driven by form.controls.foo.errors.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ErrorMessageComponent } from '../../../shared/components/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ErrorMessageComponent, LoadingSpinnerComponent],
  template: `
    <div class="page">
      <form class="card" [formGroup]="form" (ngSubmit)="onSubmit()">
        <h1>Create an account</h1>

        <app-error-message [message]="errorMessage()" />

        <label>
          <span>Username</span>
          <input type="text" formControlName="userName" autocomplete="username" />
          @if (form.controls.userName.touched && form.controls.userName.errors?.['required']) {
            <div class="field-error">Username is required.</div>
          }
          @if (form.controls.userName.touched && form.controls.userName.errors?.['minlength']) {
            <div class="field-error">Username must be at least 3 characters.</div>
          }
        </label>

        <label>
          <span>Email</span>
          <input type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
            <div class="field-error">Email is required.</div>
          }
          @if (form.controls.email.touched && form.controls.email.errors?.['email']) {
            <div class="field-error">Enter a valid email address.</div>
          }
        </label>

        <label>
          <span>Password</span>
          <input type="password" formControlName="password" autocomplete="new-password" />
          @if (form.controls.password.touched && form.controls.password.errors?.['required']) {
            <div class="field-error">Password is required.</div>
          }
          @if (form.controls.password.touched && form.controls.password.errors?.['minlength']) {
            <div class="field-error">Password must be at least 6 characters.</div>
          }
        </label>

        <button type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Creating account…' : 'Register' }}
        </button>

        <app-loading-spinner [visible]="loading()" />

        <p class="muted">Already have an account? <a routerLink="/login">Log in</a>.</p>
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
      width: 100%; max-width: 420px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: var(--space-6);
      display: flex; flex-direction: column; gap: var(--space-4);
    }
    h1 { margin: 0; }
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
  `]
})
export class RegisterComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    userName: this.fb.control('', [Validators.required, Validators.minLength(3)]),
    email:    this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', [Validators.required, Validators.minLength(6)])
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.register(this.form.getRawValue() as { userName: string; email: string; password: string })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.router.navigateByUrl('/dashboard');
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Registration failed.');
        }
      });
  }
}
