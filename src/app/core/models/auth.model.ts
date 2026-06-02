/**
 * Purpose:     Authentication-related request/response shapes.
 * Responsibility: Type definitions that mirror the API's DTOs exactly.
 *                Field names are camelCase as the API serialises them
 *                (the .NET backend uses default System.Text.Json
 *                camelCase policy, so `UserName` becomes `userName`).
 * Interactions: Used by AuthService.login() and AuthService.register().
 *
 * Why interfaces instead of classes?
 *   - They are erased at runtime (no JS output), so the bundle stays small.
 *   - They give the TypeScript compiler enough info to type-check the
 *     template, the form, and the service call site.
 *   - They act as a contract: if the API changes a field, TypeScript
 *     flags every place in the frontend that relies on it.
 */

/** POST /api/auth/login */
export interface LoginRequest {
  userName: string;
  password: string;
}

/** POST /api/auth/register */
export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
}

/** Response from /api/auth/login and /api/auth/register */
export interface AuthResponse {
  token: string;
  userId: string;
  userName: string;
  role: string;
}
