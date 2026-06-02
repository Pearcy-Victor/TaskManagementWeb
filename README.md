# TaskManagementWeb

A tutorial-style **Angular 20+** frontend that talks to the [TaskManagementAPI](../TaskManagementAPI). The codebase is laid out so a developer who knows basic HTML / CSS / JavaScript / TypeScript but has never built a real Angular application before can read it top-to-bottom and understand every layer.

> **Audience**: junior frontend developers. Every file has a header that explains *what it does*, *why it exists*, and *how it fits into the rest of the app*.

---

## 1. Tech stack

| Concern | Choice |
|---|---|
| Framework | Angular 20+ (standalone components, no NgModules) |
| Language | TypeScript 5.8+ |
| HTTP | `HttpClient` with functional interceptors |
| Forms | Reactive Forms (`FormGroup`, `FormBuilder`, `Validators`) |
| Async | RxJS 7 (`Observable`, `pipe`, `switchMap`, `catchError`, `map`) |
| Reactivity | Angular Signals (`signal`, `computed`) |
| Routing | `@angular/router` with `withComponentInputBinding` |
| UI | **None** — built-in Angular templates + a small `styles.css` |
| Auth storage | `localStorage` (JWT) |

---

## 2. Folder structure

```
src/
├── main.ts                 ← bootstraps AppComponent
├── index.html              ← HTML shell
├── styles.css              ← global minimalist CSS
├── environments/           ← environment.ts + environment.development.ts
└── app/
    ├── app.component.ts        ← root component, hosts <router-outlet>
    ├── app.config.ts           ← providers (router, HttpClient + interceptors)
    ├── app.routes.ts           ← top-level route table
    │
    ├── core/                   ← singletons; imported via DI only
    │   ├── models/                 ← TypeScript interfaces
    │   ├── services/               ← AuthService, ProjectService, TaskService, ErrorService
    │   ├── guards/                 ← authGuard (CanActivateFn)
    │   └── interceptors/           ← authInterceptor (HttpInterceptorFn)
    │
    ├── shared/                 ← reusable presentational components
    │   └── components/
    │       ├── navbar/              ← top navigation
    │       ├── loading-spinner/     ← CSS spinner
    │       └── error-message/       ← inline error banner
    │
    ├── layouts/                ← app shell components
    │   └── main-layout/             ← wraps protected pages with navbar
    │
    └── features/               ← one folder per business domain
        ├── auth/
        │   ├── login/               ← /login
        │   └── register/            ← /register (demonstrates Validators.email)
        ├── dashboard/               ← /dashboard
        ├── projects/
        │   ├── project-list/        ← /projects
        │   ├── project-create/      ← /projects/create
        │   └── project-edit/        ← /projects/edit/:id
        └── tasks/
            ├── task-list/           ← /tasks
            ├── task-create/         ← /tasks/create
            └── task-edit/           ← /tasks/edit/:id
```

### Why this structure?

In enterprise Angular apps, splitting by **layer** (services/, components/, models/) breaks down once a project grows past a handful of features. The structure above uses **three orthogonal conventions**:

1. **`core/`** — singletons that the entire app needs. The rule is: nothing inside `core/` ever imports from `features/` or `shared/`. This keeps the dependency graph one-way.
2. **`shared/`** — pure presentational components reused by multiple features. They have no business logic.
3. **`features/`** — one folder per business domain. Each feature folder owns its routes, components, and (optionally) its own state.

This is the convention recommended by the Angular team and used in the official `Nx` and `Angular Architects` style guides. It scales from 5 to 500 components without becoming spaghetti.

---

## 3. Setup & run

### 3.1 Prerequisites

- Node.js 20.x or 22.x
- npm 10+
- The [TaskManagementAPI](../TaskManagementAPI) running on `http://localhost:5075` (see its `README.md`)

### 3.2 Install

```bash
cd P:\Projects\TaskManagementWeb
npm install
```

### 3.3 Run the dev server

```bash
npm start
```

This runs `ng serve` and opens the app at <http://localhost:4200>. The dev server proxies nothing — it just serves the SPA. Make sure the API is running on port 5075 first (the API allows CORS from `http://localhost:4200`).

### 3.4 Build for production

```bash
npm run build
```

Outputs to `dist/task-management-web/`.

---

## 4. The request flow

```
User clicks a button
      │
      ▼
Component (e.g. LoginComponent)
      │   .subscribe(this.authService.login(req))
      ▼
Service (AuthService) ─── calls ──▶ HttpClient
      │
      ▼
[authInterceptor]  ← attaches Authorization: Bearer <token>
      │
      ▼
HTTP POST →  http://localhost:5075/api/auth/login
      │
      ▼
Response (AuthResponse) ────▶ Service persists token ────▶ signals update
      │
      ▼
Component reads the AuthResponse, navigates to /dashboard
```

---

## 5. Where do I add X?

| You want to… | Look here |
|---|---|
| Add a new field to a Project | `core/models/project.model.ts` |
| Add a new API call | create / extend the relevant `core/services/*.service.ts` |
| Add a new page | create a folder in `features/`, add a lazy `loadComponent` in `app.routes.ts` |
| Show a global error toast | use `ErrorService.lastError()` signal from any component |
| Restrict a route to admins | add `canActivate: [authGuard, adminGuard]` to the route |

---

## 6. Concepts explained

For a deeper walkthrough of the architecture (signals vs observables, interceptors, guards, reactive forms, RxJS operators), see [CONCEPTS.md](./CONCEPTS.md).
