import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle, LanguageSwitcher } from "@/components/theme/theme-toggle";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute inset-0 bg-circuit-grid opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-signal-glow" />

      <div className="absolute end-4 top-4 z-20 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>
        <div className="rounded-xl border border-border bg-card/85 p-6 shadow-sm backdrop-blur">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("landing.footerNote")}
        </p>
      </div>
    </div>
  );
}