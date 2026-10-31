import { getTranslations } from "next-intl/server";
import { requireInstructor } from "@/lib/auth/guard";
import { SideNav, type NavItem } from "@/components/shell/side-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Wordmark } from "@/components/brand/wordmark";

export default async function TeachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireInstructor();
  const t = await getTranslations();

  const items: NavItem[] = [
    { href: "/teach", label: t("nav.dashboard"), icon: "dashboard" },
    { href: "/teach/courses", label: t("nav.myCourses"), icon: "courses" },
    { href: "/teach/grading", label: t("nav.gradingQueue"), icon: "grading" },
    { href: "/teach/profile", label: t("nav.profile"), icon: "profile" },
  ];

  return (
    <div className="flex min-h-dvh">
      <SideNav
        items={items}
        title={t("roles.instructor")}
        footer={<Wordmark showAcademy={false} />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} roleLabel={t("roles.instructor")} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}