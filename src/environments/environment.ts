/**
 * Purpose:     Production environment configuration.
 * Responsibility: Exports the API base URL used by HttpClient calls. The
 *                development configuration overrides this file via
 *                `fileReplacements` in angular.json.
 * Interactions: Imported by services that need to call the backend.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:5075/api'
};
