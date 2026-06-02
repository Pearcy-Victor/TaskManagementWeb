/**
 * Purpose:     Inline error banner used by feature components.
 * Responsibility: Take a string error message and render it. If the
 *                error is null/empty, render nothing.
 * Interactions: Receives `message` as a signal input. Forms and
 *                services push the human-readable message here.
 *
 * Why a separate component?
 *   Every feature form (login, project-create, task-edit, …) needs to
 *   show an error. Centralising the markup avoids subtle differences
 *   in colour / spacing between forms.
 */

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-message',
  standalone: true,
  template: `
    @if (message()) {
      <div class="error" role="alert">{{ message() }}</div>
    }
  `,
  styles: [`
    .error {
      background: #fdecea;
      color: var(--color-danger);
      border: 1px solid #f5c2c0;
      border-radius: var(--radius);
      padding: var(--space-3) var(--space-4);
      margin-bottom: var(--space-4);
      font-size: 13px;
    }
  `]
})
export class ErrorMessageComponent {
  /** Human-readable error string. Null/empty means "don't render". */
  readonly message = input<string | null>(null);
}
