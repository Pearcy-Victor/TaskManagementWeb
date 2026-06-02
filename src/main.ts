/*
 * Purpose:     Entry point. Bootstraps the standalone AppComponent.
 * Responsibility: Call bootstrapApplication() with the root component and
 *                the application config (providers).
 * Interactions: Imported by the Angular CLI's esbuild bundler. Triggers the
 *                loading of AppComponent, AppConfig, and (transitively) every
 *                component/service in the app.
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
