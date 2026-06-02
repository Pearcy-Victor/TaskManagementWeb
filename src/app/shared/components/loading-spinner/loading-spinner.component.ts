/**
 * Purpose:     A minimal CSS-only loading spinner.
 * Responsibility: Render an animated circle while parent components
 *                are waiting for an HTTP call to resolve.
 * Interactions: Receives `visible` as an input. The parent toggles
 *                it to true/false based on the loading state of its
 *                data source.
 *
 * Why pure CSS?
 *   We don't want to bring in an icon library or spinner package for
 *   a single visual effect. The @keyframes animation below is a few
 *   lines and has zero runtime dependencies.
 */

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="overlay" role="status" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <span class="sr-only">Loading…</span>
      </div>
    }
  `,
  styles: [`
    .overlay {
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-5);
    }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .sr-only {
      position: absolute; width: 1px; height: 1px;
      padding: 0; margin: -1px; overflow: hidden;
      clip: rect(0, 0, 0, 0); border: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {
  /** Whether the spinner should be rendered. */
  readonly visible = input<boolean>(false);
}
