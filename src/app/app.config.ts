/**
 * Purpose:     Application-wide DI configuration.
 * Responsibility: Register providers that the app needs as singletons:
 *                - Router (with our route table and component-input binding)
 *                - HttpClient (with the auth interceptor attached)
 * Interactions: Consumed by main.ts via bootstrapApplication().
 *                The interceptor registered here wraps every HttpClient call.
 */

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Modern Angular uses zone coalescing for fewer change-detection cycles.
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router with component-input binding so route params can be injected
    // directly as @Input() properties on routed components.
    provideRouter(routes, withComponentInputBinding()),

    // HttpClient with the auth interceptor attached. Every outgoing
    // request will pass through `authInterceptor` first.
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
