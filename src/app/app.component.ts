/**
 * Purpose:     Root standalone component of the application.
 * Responsibility: Hosts the <router-outlet>. The router decides which
 *                feature component to render based on the current URL.
 * Interactions: Bootstrapped by main.ts. The router renders either
 *                MainLayout (protected) or LoginComponent (public) here.
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent {}
