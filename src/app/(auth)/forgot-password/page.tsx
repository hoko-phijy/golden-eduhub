import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ForgotPasswordPage() {
  const t = await getTranslations();

  return (
    <>
      <div className="mb-6 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("auth.resetTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("auth.resetSubtitle")}</p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.emailLabel")}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required dir="ltr" />
        </div>
        <Button type="submit" className="w-full" disabled>
          {t("auth.resetButton")}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-signal hover:underline">
          {t("common.back")}
        </Link>
      </p>
    </>
  );
}