import "server-only";
import { redirect } from "next/navigation";
import { ROLE_HOME, type Role } from "./roles";
import { getSessionUser, type SessionUser } from "./session";

/**
 * The permission spine. Every guarded page, Server Action and route handler funnels
 * through here — see docs/04-roles-and-permissions.md §9.
 *
 * Rules this file encodes:
 *  - a missing session redirects, it never renders a page
 *  - a wrong role redirects to that role's own home rather than showing a 403 dead end
 *  - a user who must change their password is sent there first, always
 *
 * Phase 1 extends this with requireCourseAccess(courseId, level) and the resource-level
 * guards. Those need the database, so they land with the schema.
 */

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}

export const requireAdmin = () => requireRole("ADMIN");
export const requireInstructor = () => requireRole("INSTRUCTOR");
export const requireStudent = () => requireRole("STUDENT");