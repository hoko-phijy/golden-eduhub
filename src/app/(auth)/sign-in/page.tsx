import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignInPage() {
  const t = await getTranslations();

  return (
    <>
      <div className="mb-6 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("auth.signInTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth.signInSubtitle")}</p>
      </div>

      {/*
        Phase 1 replaces this with a Server Action calling signIn() from
        docs/06-server-surface.md. The form is intentionally not wired to a fake handler:
        a form that appears to work and does not is worse than one that is clearly pending.
      */}
      <form className="space-y-4" aria-describedby="signin-pending">
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.emailLabel")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-signal hover:underline"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            dir="ltr"
          />
        </div>

        <Button type="submit" className="w-full" disabled>
          {t("auth.signInButton")}
        </Button>

        <p id="signin-pending" className="text-center text-xs text-muted-foreground">
          {t("auth.signInPending")}
        </p>
      </form>
    </>
  );
}