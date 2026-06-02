/**
 * Purpose:     Shape of a "User" as exposed to the frontend.
 * Responsibility: Type definition only. The API never returns a User
 *                entity directly (it would leak PasswordHash). Instead,
 *                AuthResponse returns { userId, userName, role } which
 *                this interface represents as a client-side user object.
 * Interactions: Used by AuthService to populate the `currentUser` signal,
 *                and by the Navbar to show the logged-in user.
 *
 * NOTE on naming: the API serialises the field as `userName` (lowercase
 * 'N'). We mirror that exactly so JSON deserialisation works without
 * custom property mapping.
 */

export interface User {
  id: string;
  userName: string;
  email: string;
  role: 'Admin' | 'User';
  createdAt: string;
}

/**
 * Convenience type guard. The API only guarantees the role string exists;
 * we narrow it to the union above for safer template usage.
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'Admin';
}
