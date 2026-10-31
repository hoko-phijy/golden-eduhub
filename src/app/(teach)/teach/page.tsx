import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  Plus,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TeachDashboard() {
  const t = await getTranslations();

  const stats = [
    { label: t("teach.statAwaitingGrading"), icon: ClipboardCheck },
    { label: t("teach.statDueThisWeek"), icon: CalendarClock },
    { label: t("teach.statAverageScore"), icon: GraduationCap },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.dashboard")}
        description={t("teach.description")}
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link href="/teach/courses">
              <BookOpen className="size-4" />
              {t("nav.myCourses")}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
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

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">{t("nav.myCourses")}</CardTitle>
          <Badge variant="outline" className="font-normal">
            {t("teach.ownedByYou")}
          </Badge>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BookOpen}
            title={t("teach.noCoursesTitle")}
            description={t("teach.noCoursesText")}
            action={
              <Button variant="outline" size="sm" disabled className="gap-2">
                <Plus className="size-4" />
                {t("teach.assignedByAdmin")}
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}