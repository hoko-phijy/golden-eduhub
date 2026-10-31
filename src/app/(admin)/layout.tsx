import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/guard";
import { SideNav, type NavItem } from "@/components/shell/side-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Wordmark } from "@/components/brand/wordmark";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const t = await getTranslations();

  const items: NavItem[] = [
    { href: "/admin", label: t("nav.dashboard"), icon: "dashboard" },
    { href: "/admin/courses", label: t("nav.courses"), icon: "courses" },
    { href: "/admin/instructors", label: t("nav.instructors"), icon: "instructors" },
    { href: "/admin/students", label: t("nav.students"), icon: "students" },
    { href: "/admin/gradebook", label: t("nav.gradebook"), icon: "gradebook" },
    { href: "/admin/audit", label: t("nav.audit"), icon: "audit" },
    { href: "/admin/settings", label: t("nav.settings"), icon: "settings" },
  ];

  return (
    <div className="flex min-h-dvh">
      <SideNav
        items={items}
        title={t("roles.admin")}
        footer={<Wordmark showAcademy={false} />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} roleLabel={t("roles.admin")} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}