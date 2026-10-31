"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { isRtl } from "@/i18n/locale";
import { navIcons, type NavIconName } from "./nav-icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type NavItem = {
  href: string;
  label: string;
  icon?: NavIconName;
};

/**
 * Sidebar navigation shared by the three role shells.
 *
 * Active state is exact-match for the section root and prefix-match for children, so
 * /teach/courses does not light up while you are on /teach.
 *
 * The mobile drawer opens from the leading edge, which flips with the document direction.
 */
export function SideNav({
  items,
  footer,
  title,
}: {
  items: NavItem[];
  footer?: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations();
  const drawerSide = isRtl(locale) ? "right" : "left";

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const list = (
    <nav className="flex flex-col gap-1" aria-label={title ?? t("nav.main")}>
      {items.map(({ href, label, icon }) => {
        const active = isActive(href);
        const Icon = icon ? navIcons[icon] : null;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "bg-primary/12 text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  active
                    ? "text-signal"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
            ) : null}
            <span className="truncate">{label}</span>
            {active ? <span className="ms-auto h-4 w-0.5 rounded-full bg-primary" /> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 border-e border-border bg-card/40 md:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-6 p-4">
          <div className="flex-1 overflow-y-auto">{list}</div>
          {footer ? <div className="border-t border-border pt-3">{footer}</div> : null}
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("common.openNav")}>
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={drawerSide} className="w-64 p-4">
            <SheetTitle className="mb-4 text-sm font-semibold">{title}</SheetTitle>
            {list}
            {footer ? <div className="mt-4 border-t border-border pt-3">{footer}</div> : null}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}