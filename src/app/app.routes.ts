/**
 * Purpose:     Top-level route table for the application.
 * Responsibility: Map URL patterns to components. Public routes (login,
 *                register) live at the root level. Protected routes are
 *                wrapped in MainLayout and guarded by authGuard.
 * Interactions: Consumed by provideRouter() in app.config.ts.
 *                AuthGuard protects everything except /login and /register.
 *
 * NOTE: This file is filled in incrementally as features are added.
 * The empty `loadComponent` placeholders below will be replaced when
 * each feature is implemented.
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'projects/create',
        loadComponent: () =>
          import('./features/projects/project-create/project-create.component').then(m => m.ProjectCreateComponent)
      },
      {
        path: 'projects/edit/:id',
        loadComponent: () =>
          import('./features/projects/project-edit/project-edit.component').then(m => m.ProjectEditComponent)
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-list/task-list.component').then(m => m.TaskListComponent)
      },
      {
        path: 'tasks/create',
        loadComponent: () =>
          import('./features/tasks/task-create/task-create.component').then(m => m.TaskCreateComponent)
      },
      {
        path: 'tasks/edit/:id',
        loadComponent: () =>
          import('./features/tasks/task-edit/task-edit.component').then(m => m.TaskEditComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
