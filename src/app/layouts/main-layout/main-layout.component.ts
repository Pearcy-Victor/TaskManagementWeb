/**
 * Purpose:     Shell layout for every protected page.
 * Responsibility: Wrap the page content with the top navbar and a
 *                <router-outlet> that renders the current child route.
 * Interactions:
 *   - Used as the parent component in the protected `''` route in
 *     app.routes.ts.
 *   - Contains <app-navbar> from the shared layer.
 *   - The <router-outlet> renders DashboardComponent, ProjectListComponent,
 *     etc. depending on the URL.
 *
 * Why use a layout component?
 *   The navbar and the page container are identical on every protected
 *   page. Defining them once in a parent component (and using child
 *   routes for the page-specific content) follows the DRY principle
 *   and keeps the feature components focused on their own concerns.
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--color-bg); }
    .content {
      max-width: 1100px;
      margin: 0 auto;
      padding: var(--space-5);
    }
  `]
})
export class MainLayoutComponent {}
