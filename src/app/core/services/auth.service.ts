/**
 * Purpose:     The single point of contact between the UI and the auth API.
 * Responsibility: Manage JWT login/register/logout, persist the token in
 *                localStorage, and expose authentication state via
 *                signals.
 * Interactions:
 *   - LoginComponent and RegisterComponent call login()/register().
 *   - AuthGuard reads isAuthenticated() to decide whether to allow
 *     route activation.
 *   - AuthInterceptor reads getToken() to build the Authorization header.
 *   - Navbar reads currentUser() to show "Hello, <name>".
 *
 * RxJS notes:
 *   - login() and register() return Observable<AuthResponse> so callers
 *     can compose them with operators (catchError, switchMap, etc.).
 *   - The side effects (saving to localStorage, updating the signal)
 *     happen INSIDE the observable chain so they only run on success.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { User } from '../models/user.model';
import { ErrorService } from './error.service';

const TOKEN_KEY = 'tmw.auth.token';
const USER_KEY  = 'tmw.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);

  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  /**
   * Reactive state — Signals.
   * currentUser holds the logged-in user (or null).
   * authState is a computed boolean derived from currentUser's presence.
   */
  readonly currentUser = signal<User | null>(this.loadUserFromStorage());
  readonly authState = computed(() => this.currentUser() !== null);

  // ───────────────────────────── LOGIN ─────────────────────────────
  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, req)
      .pipe(
        // tap() runs the side effect on success without changing the stream.
        tap((res) => this.persistSession(res)),
        // catchError() centralises error reporting. We re-throw so the
        // calling component can still show its own message if it wants.
        catchError((err) => {
          this.errorService.report(err);
          return throwError(() => err);
        })
      );
  }

  // ──────────────────────────── REGISTER ───────────────────────────
  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, req)
      .pipe(
        tap((res) => this.persistSession(res)),
        catchError((err) => {
          this.errorService.report(err);
          return throwError(() => err);
        })
      );
  }

  // ───────────────────────────── LOGOUT ────────────────────────────
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  // ──────────────────────────── TOKEN ──────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // ─────────────────── AUTHENTICATION CHECK ────────────────────────
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ──────────────────────── PRIVATE HELPERS ────────────────────────
  private persistSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);

    // Build a User object from the AuthResponse. We use 'role' as-is;
    // the API only returns "Admin" or "User".
    const user: User = {
      id: res.userId,
      userName: res.userName,
      email: '',                  // not provided in AuthResponse
      role: res.role as User['role'],
      createdAt: ''
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUserFromStorage(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
