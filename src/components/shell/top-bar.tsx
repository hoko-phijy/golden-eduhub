import { getTranslations } from "next-intl/server";
import { Bell, Search } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle, LanguageSwitcher } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Top bar for the three app shells. Server component: it takes already-resolved user
 * details as props rather than fetching, so the shell stays cheap and the guard stays
 * in one place (the layout).
 */
export async function TopBar({
  user,
  roleLabel,
  unreadCount = 0,
}: {
  user: { name: string; email: string };
  roleLabel: string;
  unreadCount?: number;
}) {
  const t = await getTranslations();

  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="md:hidden">
        <Wordmark showAcademy={false} />
      </div>

      <div className="relative ms-auto hidden max-w-xs flex-1 sm:block md:ms-0">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("common.search")}
          aria-label={t("common.search")}
          className="h-9 ps-8"
        />
      </div>

      <div className="ms-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("nav.notifications")}
          className="relative"
        >
          <Bell className="size-4" />
          {unreadCount > 0 ? (
            <span className="absolute end-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>

        <LanguageSwitcher />
        <ThemeToggle />

        <div className="ms-1 flex items-center gap-2 border-s border-border ps-2">
          <div className="grid size-8 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-signal ring-1 ring-primary/20">
            {initials || "?"}
          </div>
          <div className="hidden leading-tight lg:block">
            <p className="max-w-32 truncate text-xs font-medium">{user.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}