import type { Role } from "./roles";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
};

/**
 * TEMPORARY session resolution.
 *
 * Real session auth (opaque cookie token + `session` table, Argon2id hashes) is Phase 1 in
 * docs/07-roadmap-mvp.md. Until the Prisma client and schema exist there is nothing honest
 * to read a session from, so this returns null and every guarded page redirects to sign-in.
 *
 * The dev preview below exists so the UI can be reviewed before auth lands. It is gated on
 * NODE_ENV !== "production" and on an explicit env var, so it cannot be switched on in a
 * deployed environment by accident. Delete this block when Phase 1 lands.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (process.env.NODE_ENV !== "production") {
    const preview = process.env.GOLDEN_DEV_PREVIEW_ROLE;
    if (preview === "ADMIN" || preview === "INSTRUCTOR" || preview === "STUDENT") {
      return {
        id: `dev-preview-${preview.toLowerCase()}`,
        name:
          preview === "ADMIN"
            ? "Academy Admin"
            : preview === "INSTRUCTOR"
              ? "Sample Instructor"
              : "Sample Student",
        email: `${preview.toLowerCase()}@golden.academy`,
        role: preview,
        mustChangePassword: false,
      };
    }
  }
  return null;
}