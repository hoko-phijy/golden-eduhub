import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { BookOpen, CalendarClock, GraduationCap } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function StudentDashboard() {
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.dashboard")}
        description={t("student.description")}
        actions={
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href="/my/courses">
              <BookOpen className="size-4" />
              {t("nav.myCourses")}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarClock className="size-4 text-signal" />
              {t("student.dueSoon")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title={t("student.nothingDue")}
              description={t("student.nothingDueText")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <GraduationCap className="size-4 text-signal" />
              {t("student.recentlyGraded")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title={t("student.noGrades")}
              description={t("student.noGradesText")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}