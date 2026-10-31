/**
 * Role definitions.
 *
 * Declared here rather than imported from @prisma/client because the Prisma schema lands
 * in Phase 1. When it does, this file becomes the single place that maps the DB enum to
 * the app type, so nothing else has to change.
 */
export const ROLES = ["ADMIN", "INSTRUCTOR", "STUDENT"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** Where each role lands after sign-in. Mirrors docs/05-screens-and-routes.md. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  INSTRUCTOR: "/teach",
  STUDENT: "/my",
};