import { getTranslations } from "next-intl/server";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Admin dashboard.
 *
 * Every figure below is a placeholder carrying the phase that fills it, not invented data.
 * Phase 5 replaces each with a real aggregate query.
 */
export default async function AdminDashboard() {
  const t = await getTranslations();

  const stats = [
    { label: t("admin.statsActiveCourses"), icon: BookOpen },
    { label: t("admin.statsStudents"), icon: Users },
    { label: t("admin.statsAwaitingGrading"), icon: ClipboardList },
    { label: t("admin.statsAverageScore"), icon: TrendingUp },
  ];

  const actions = [
    { label: t("admin.createInstructor"), icon: GraduationCap },
    { label: t("admin.createCourse"), icon: BookOpen },
    { label: t("admin.importStudents"), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.dashboard")}
        description={t("admin.description")}
        actions={
          <Badge variant="outline" className="gap-1.5 font-normal">
            <ShieldCheck className="size-3 text-signal" />
            {t("roles.admin")}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="font-mono text-xl font-medium tracking-tight text-muted-foreground/40">
                  ···
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t("common.phasePending")}
                </p>
              </div>
              <div className="grid size-9 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Icon className="size-4 text-signal" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">{t("admin.recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("admin.recentActivityEmpty")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("admin.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {actions.map(({ label, icon: Icon }) => (
              <p key={label} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="size-4 shrink-0 text-signal" />
                {label}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}