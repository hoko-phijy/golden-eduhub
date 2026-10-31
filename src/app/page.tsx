import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle, LanguageSwitcher } from "@/components/theme/theme-toggle";

export default async function LandingPage() {
  const t = await getTranslations();

  const features = [
    {
      icon: BookOpen,
      title: t("landing.featureCourses"),
      body: t("landing.featureCoursesText"),
    },
    {
      icon: Sparkles,
      title: t("landing.featureAssessment"),
      body: t("landing.featureAssessmentText"),
    },
    {
      icon: ShieldCheck,
      title: t("landing.featureControl"),
      body: t("landing.featureControlText"),
    },
  ];

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-circuit-grid opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-signal-glow" />

      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <Wordmark />
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--signal)]" />
          {t("landing.eyebrow")}
        </p>

        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          {t("landing.heading")}
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          {t("landing.subheading")}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/sign-in">
              {t("landing.signInCta")}
              <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">{t("landing.footerNote")}</p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur transition-colors hover:border-primary/30"
            >
              <div className="mb-3 grid size-9 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Icon className="size-4 text-signal" />
              </div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}