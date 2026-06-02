/**
 * Purpose:     Top navigation bar shown on every protected page.
 * Responsibility: Display the brand, a few primary links, the current
 *                user's name, and a Logout button. On click, the
 *                Logout button clears the session and routes to /login.
 * Interactions: Reads currentUser() from AuthService. Calls
 *                AuthService.logout() and uses Angular Router to
 *                navigate away.
 *
 * Why a "shared" component?
 *   The navbar is purely presentational and used by every page that
 *   lives inside MainLayout. Putting it in `shared/components/` makes
 *   that intent obvious to other developers.
 */

import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <a class="brand" routerLink="/dashboard">TaskManager</a>

      <nav class="links">
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/projects"   routerLinkActive="active">Projects</a>
        <a routerLink="/tasks"      routerLinkActive="active">Tasks</a>
      </nav>

      <div class="right">
        @if (auth.currentUser(); as user) {
          <span class="who">Hello, <strong>{{ user.userName }}</strong></span>
          <button type="button" (click)="onLogout()">Logout</button>
        }
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      gap: var(--space-5);
      padding: var(--space-3) var(--space-5);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }
    .brand { font-weight: 700; font-size: 16px; color: var(--color-text); }
    .links { display: flex; gap: var(--space-4); flex: 1; }
    .links a { color: var(--color-muted); padding: var(--space-2) var(--space-3); border-radius: var(--radius); }
    .links a.active { background: var(--color-bg); color: var(--color-text); }
    .right { display: flex; align-items: center; gap: var(--space-3); }
    .who { color: var(--color-muted); }
    button {
      padding: var(--space-2) var(--space-3);
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      color: var(--color-text);
    }
    button:hover { background: var(--color-bg); }
  `]
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
