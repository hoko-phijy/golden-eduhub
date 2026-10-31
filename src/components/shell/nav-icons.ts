import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

/**
 * Icon registry.
 *
 * Server Components cannot pass component functions to Client Components, so navigation
 * items carry an icon *name* and the client resolves it here. Adding an icon means adding
 * it to this map — which is also what keeps the client bundle from pulling in all of
 * lucide.
 */
export const navIcons = {
  dashboard: LayoutDashboard,
  courses: BookOpen,
  instructors: GraduationCap,
  students: Users,
  gradebook: ClipboardList,
  audit: ShieldCheck,
  settings: Settings,
  grading: ClipboardCheck,
  grades: GraduationCap,
  profile: UserRound,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof navIcons;