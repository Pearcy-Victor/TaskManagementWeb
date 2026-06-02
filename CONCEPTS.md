# Concepts — Angular Architecture Deep Dive

This document explains the major Angular concepts used in `TaskManagementWeb`, in the order a junior developer would naturally encounter them. Read it next to the code; every section points at the file that demonstrates the idea.

> **Audience**: you know HTML, CSS, JavaScript, and basic TypeScript. You have never built a real Angular app.

---

## 1. Standalone Components

**File**: every `.component.ts` in the codebase (e.g. `app.component.ts`).

A "standalone component" is one that declares its own dependencies (imports) instead of inheriting them from an NgModule. Standalone is the default in Angular 17+ and the **only** style in Angular 20.

```ts
@Component({
  selector: 'app-login',
  standalone: true,        // <-- this is the magic word
  imports: [ReactiveFormsModule, RouterLink, ErrorMessageComponent],
  template: `…`
})
export class LoginComponent {}
```

The `imports` array is the component's manifest: it lists every directive, pipe, and component used in the template. Angular reads this at compile time and tree-shakes anything not used.

**Why this matters**: NgModules (the old way) forced you to maintain a separate file that knew about every component in the app. Standalone components are self-contained — easier to reason about, easier to lazy-load, and easier to delete.

---

## 2. Dependency Injection (DI)

**Files**: every `*.service.ts` and the `authInterceptor`, `authGuard`.

DI is the mechanism Angular uses to give a class the things it needs, without that class having to `new` them.

```ts
@Injectable({ providedIn: 'root' })   // makes the service a singleton
export class AuthService {
  private readonly http = inject(HttpClient);  // <-- DI happens here
  // ...
}
```

Three key points:

1. **`providedIn: 'root'`** registers the service as a singleton at the application level. Every component that injects `AuthService` gets the same instance.
2. **`inject()`** is the modern, function-based way to do DI. It replaces the old `constructor(private auth: AuthService) {}` pattern. The benefit: it can be called inside any function (e.g. inside a guard), not just at the top of a class.
3. **Hierarchical injectors**: a service provided in a route's `providers: []` array is only visible to that route and its children. We don't use that here — everything is at root level.

---

## 3. Routing

**File**: `src/app/app.routes.ts`.

Routing is the mapping from URL to component. The route table is an array of `Route` objects:

```ts
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'projects/edit/:id', loadComponent: () => import('./features/projects/project-edit/project-edit.component').then(m => m.ProjectEditComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
```

Concepts:

- **`loadComponent` (lazy loading)**: the import is wrapped in a function. Angular downloads the chunk the first time the user navigates there — the initial bundle stays small. The `.then(m => m.LoginComponent)` is just an ES module trick to get the class out of the module.
- **Children**: a parent component (`MainLayoutComponent`) is rendered once. Its `<router-outlet>` then renders the child that matches the URL. This is how we share the navbar across every protected page.
- **`:id` (route parameter)**: a placeholder. Read it with `this.route.snapshot.paramMap.get('id')` or with `this.route.paramMap` as an Observable.
- **Wildcard `{ path: '**' }`**: catches anything that didn't match. We redirect to `''`, which then redirects to `dashboard`.
- **`redirectTo: ''` with `pathMatch: 'full'`**: required for empty-path redirects to work as expected (otherwise Angular would match every URL).
- **`withComponentInputBinding()`** in `app.config.ts`: enables an alternative way to read route data — `@Input() id` is automatically populated from `:id` for the routed component.

Navigation is done declaratively (`routerLink="/projects"`) or imperatively (`router.navigate(['/projects'])`).

---

## 4. Guards

**File**: `src/app/core/guards/auth.guard.ts`.

A guard is a function Angular calls **before activating a route**. If the function returns `true`, navigation proceeds. If it returns a `UrlTree`, Angular redirects. If it returns `false`, navigation is cancelled.

```ts
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
```

Modern Angular (15+) uses the **functional** form (`CanActivateFn`) instead of the old class-based form. It's just a function — no boilerplate.

---

## 5. Interceptors

**File**: `src/app/core/interceptors/auth.interceptor.ts`.

An interceptor is a function that wraps **every** HTTP request and response. It runs in a pipeline: `component → AuthInterceptor → HttpClient → network`.

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

It is registered globally in `app.config.ts`:

```ts
provideHttpClient(withInterceptors([authInterceptor]))
```

The `withInterceptors([...])` API lets you stack many interceptors — they're applied in order, like Express middleware. Common uses:

- Attach JWTs (what we do)
- Log every request
- Retry on transient failure
- Map validation errors into a friendly format
- Refresh the token on 401

---

## 6. Reactive Forms

**Files**: every form component — `login.component.ts`, `register.component.ts`, `project-create`, `project-edit`, `task-create`, `task-edit`.

Reactive Forms are explicit, programmatic, and testable. You build the form in TypeScript, and Angular tracks value + validity automatically.

### The four building blocks

| Class | What it does |
|---|---|
| `FormControl` | One input field. Tracks value + valid + errors + touched. |
| `FormGroup` | A named collection of controls (e.g. `loginForm`). |
| `FormBuilder` | A service that builds controls/groups in one expression. |
| `Validators` | A static class of validation functions. |

### Minimal example (from `login.component.ts`)

```ts
readonly form = this.fb.nonGroup({
  userName: this.fb.nonGroup('', [Validators.required]),
  password: this.fb.nonGroup('', [Validators.required, Validators.minLength(3)])
});
```

- `fb.nonGroup({...})` is a shortcut for `new FormGroup({...})` where every control is **non-nullable** (the value is guaranteed to be a string, never `null`). Use `fb.group({...})` if you want nullable controls.
- The first argument of `fb.nonGroup(value, [validators])` is the initial value.
- The array of validators runs every time the value changes.

### Common validators

| Validator | Rejects |
|---|---|
| `Validators.required` | empty string, null, undefined |
| `Validators.minLength(n)` | strings shorter than `n` |
| `Validators.maxLength(n)` | strings longer than `n` |
| `Validators.email` | strings that don't match an email regex |
| `Validators.pattern(regex)` | strings that don't match the given regex |

### Template wiring

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <input formControlName="userName" />
  @if (form.controls.userName.touched && form.controls.userName.errors?.['required']) {
    <div class="field-error">Username is required.</div>
  }
  <button type="submit" [disabled]="form.invalid">Submit</button>
</form>
```

Three things to notice:

1. `[formGroup]="form"` connects the template to the TypeScript object.
2. `formControlName="userName"` on the input binds that input to the named control. The names **must** match the keys in the FormGroup.
3. `form.controls.userName.errors?.['required']` reads the validators' error map. If the user touched the field and the `required` error is present, show the message.

### Why "Reactive" Forms and not "Template-driven" Forms?

Template-driven forms are easier at first (write the form, add `ngModel`, done) but quickly become hard to test. Reactive Forms:

- Centralise form logic in TypeScript (easier to unit-test).
- Make dynamic forms (add/remove fields) natural.
- Give you typed access to values via `form.getRawValue()`.

---

## 7. RxJS

**Files**: every service + the dashboard + project-edit + task-edit.

RxJS is the standard library for **reactive programming** with Observables. An `Observable<T>` is a stream of `T` values over time — zero, one, or many.

### The four operators you must know

#### `subscribe()`

Kicks off the Observable. The standard signature is:

```ts
observable.subscribe({
  next: (value) => { /* called for each emitted value */ },
  error: (err)   => { /* called once on failure */ },
  complete: ()   => { /* called once on success-completion */ }
});
```

If you forget to `subscribe()`, **nothing happens** — Observables are cold.

#### `pipe()`

Chains operators together. Reads top to bottom:

```ts
http.get(url).pipe(
  map(x => x.items),     // transform
  filter(x => x.length), // skip empty
  catchError(err => of([])) // fallback on error
).subscribe(items => …);
```

#### `map()`

Transforms each emitted value. Pure function, no side effects.

```ts
// Turn a User into a display name
users$.pipe(map(u => u.fullName))
```

#### `switchMap()`

The most important "flavour" of the `flatMap` family. It:

1. Receives a value from the source observable.
2. Calls a function that returns a **new** inner observable.
3. **Cancels the previous inner observable** if the source emits again.

Used for "load by id" patterns where the id comes from a route param:

```ts
// Each time :id changes, fire a new GET and cancel the old one.
route.paramMap.pipe(
  switchMap(params => this.taskService.getById(params.get('id')!))
).subscribe(task => …);
```

If you used `mergeMap` instead, multiple in-flight requests could complete out of order and clobber the form with stale data.

Other flavours: `concatMap` (waits for inner to finish), `exhaustMap` (ignores new sources while inner runs). `switchMap` is what you want 90% of the time.

#### `catchError()`

Handles errors from anywhere upstream. Re-throw to let the caller react, or return a fallback value to keep the stream alive.

```ts
getAll(): Observable<Project[]> {
  return this.http.get<Project[]>(url).pipe(
    catchError(err => {
      this.errorService.report(err);
      return throwError(() => err);   // <-- re-throw so .subscribe().error still fires
    })
  );
}
```

### Other useful operators

| Operator | Use |
|---|---|
| `tap(x => …)` | Run a side effect without modifying the value (e.g. log). |
| `filter(x => …)` | Skip values that don't match. |
| `of(x)` | Create an observable that emits a single value. |
| `forkJoin({a, b})` | Wait for multiple observables to complete; emit last value of each as one object. Used in the dashboard. |
| `debounceTime(ms)` | Throttle noisy inputs (great for search boxes). |
| `distinctUntilChanged()` | Skip duplicate emissions. |

---

## 8. Signals

**Files**: `auth.service.ts`, `dashboard.component.ts`, `task-list.component.ts`.

A signal is a **synchronous** reactive container for a value. Read it like a function; write it with `.set()` or `.update()`.

```ts
const count = signal(0);     // create
count.set(5);                // overwrite
count.update(n => n + 1);    // transform
console.log(count());        // 5 — read

const isPositive = computed(() => count() > 0);  // derived value
```

### Signals vs Observables

|  | Signal | Observable |
|---|---|---|
| Sync? | ✅ Synchronous reads | ❌ Async by default |
| Best for | UI state, current value | HTTP, events, streams |
| Reads | `count()` | `count$.subscribe(…)` |
| Derived | `computed(() => ...)` | `observable$.pipe(map(...))` |
| Multi-value | ❌ Holds a single value | ✅ Emits many values over time |
| Cancel? | N/A | `.unsubscribe()` required |

**When to use which**:

- **HTTP responses** → Observable. They're inherently async.
- **"What is the current user?"** → Signal. The answer is one value that changes occasionally.
- **Computed values from signals** → `computed()`. Auto-updates when its inputs change.
- **Component template** → Signals are read directly: `@if (auth.currentUser(); as user) { Hello {{ user.userName }} }`.

In `auth.service.ts` we use BOTH:

- `currentUser = signal<User | null>(null)` — a synchronous, instantly-readable value for templates.
- `login()` and `register()` return `Observable<AuthResponse>` — async HTTP, composed with operators.

The signal is **updated** inside the `tap()` operator on success:

```ts
login(req): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(url, req).pipe(
    tap(res => {                              // <-- side effect
      this.currentUser.set({ id: res.userId, … });
    })
  );
}
```

---

## 9. HttpClient

**File**: `core/services/*.service.ts`.

`HttpClient` is Angular's wrapper around `fetch`/`XMLHttpRequest`. It returns **cold Observables** — nothing happens until you `subscribe()`.

### Request shapes

```ts
http.get<T>(url): Observable<T>
http.get<T>(url, { params: { ... } }): Observable<T>
http.post<T>(url, body): Observable<T>
http.put<T>(url, body): Observable<T>
http.delete<T>(url): Observable<T>
```

### Error shape

Failures arrive as `HttpErrorResponse`:

```ts
{
  status: 400,
  statusText: 'Bad Request',
  error: { message: 'Username is already taken.' },   // our API's payload
  url: 'http://localhost:5075/api/auth/register',
  …
}
```

`ErrorService.extractMessage(err)` knows how to read all of these:

1. `{ message: '…' }` (our API).
2. `{ errors: { FieldName: ['msg'] } }` (ASP.NET model-state).
3. Fall back to a status-code-based message.

### Why centralise HTTP in services?

- **Single source of truth for URLs** — if the API moves to `/v2/projects`, you change it in one file.
- **Composability** — services return `Observable<T>`, so a component can `forkJoin` two of them, or `switchMap` off a route param.
- **Testability** — you can swap a service out for a fake in unit tests by providing a different value with `{ provide: ProjectService, useValue: fakeProjectService }`.

---

## 10. Error handling

**Files**: `core/services/error.service.ts`, every component.

The pattern we use:

1. **Service level**: every service pipes through `catchError`, calls `errorService.report(err)` to update a `lastError` signal, then re-throws so the component can still display an inline error.
2. **Component level**: each component keeps a local `errorMessage` signal that the template binds to via `<app-error-message [message]="errorMessage()" />`.
3. **Inline form errors**: `form.controls.foo.errors?.['required']` is read in the template and rendered next to the field.

This gives us:

- A consistent error UX (the same red banner everywhere).
- Service-level visibility (a future global toast could subscribe to `errorService.lastError()`).
- Per-component customisation (login shows different copy than register).

---

## 11. The Angular change-detection / zone story (a hint)

Angular uses **Zones** to know when to re-render the UI. Anything that triggers a Zone event (HTTP response, click, timer, setTimeout) causes Angular to walk the component tree and update the DOM. This is why your template `{{ userName }}` re-renders when you assign `this.userName = ...`.

Signals participate in a *second* mechanism: when a signal is read inside a template, Angular tracks that dependency. When the signal changes, only the components that read it re-render. This is much faster than walking the whole tree — and is one of the main reasons Signals were introduced.

In `app.config.ts` you'll see:

```ts
provideZoneChangeDetection({ eventCoalescing: true })
```

`eventCoalescing: true` groups multiple Zone events (e.g. several HTTP responses arriving in the same microtask) into a single change-detection pass. This is purely a performance knob — it changes nothing about the API.

---

## 12. Putting it all together — a request's life

Click "Create project" on `/projects/create`:

1. The `<form>` calls `(ngSubmit)="onSubmit()"`.
2. `onSubmit()` validates the form (`form.invalid`), then calls `this.projectsSvc.create(...)`.
3. `ProjectService.create()` calls `http.post(url, body)`.
4. The `authInterceptor` clones the request, attaches `Authorization: Bearer <token>`, and forwards it.
5. The browser sends the request to `http://localhost:5075/api/projects`.
6. The API checks the JWT, runs the controller, returns `201 Created` with the new project.
7. `ProjectService.create()` resolves; the `subscribe({ next, error })` block in the component fires.
8. `next` calls `router.navigate(['/projects'])`. The route changes; the lazy chunk for `ProjectListComponent` is downloaded.
9. `ProjectListComponent.ngOnInit()` calls `projectsSvc.getAll()` and the cycle restarts.
10. Meanwhile, the change-detection cycle notices the templates that read `projects()` and re-renders them with the new data.

That's one user action → at least 5 separate concerns working together. Each of them lives in exactly one file. The benefit of the architecture is that you can swap any piece (e.g. add a different interceptor, add a new feature folder) without touching the rest.
