/**
 * Purpose:     Development environment configuration.
 * Responsibility: Mirrors `environment.ts` but used during `ng serve`.
 *                The API base URL is read from the TaskManagementAPI's
 *                launchSettings.json — adjust here if you change ports.
 * Interactions: Replaces `environment.ts` at build time when the
 *                development configuration is active.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5075/api'
};
