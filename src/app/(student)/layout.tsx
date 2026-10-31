import { getTranslations } from "next-intl/server";
import { requireStudent } from "@/lib/auth/guard";
import { SideNav, type NavItem } from "@/components/shell/side-nav";
import { TopBar } from "@/components/shell/top-bar";
import { Wordmark } from "@/components/brand/wordmark";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStudent();
  const t = await getTranslations();

  const items: NavItem[] = [
    { href: "/my", label: t("nav.dashboard"), icon: "dashboard" },
    { href: "/my/courses", label: t("nav.myCourses"), icon: "courses" },
    { href: "/my/grades", label: t("nav.grades"), icon: "grades" },
    { href: "/my/profile", label: t("nav.profile"), icon: "profile" },
  ];

  return (
    <div className="flex min-h-dvh">
      <SideNav
        items={items}
        title={t("roles.student")}
        footer={<Wordmark showAcademy={false} />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} roleLabel={t("roles.student")} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}