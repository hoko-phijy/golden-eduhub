import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The wordmark. A small circuit-node glyph next to the name, drawn in CSS so it inherits
 * the theme and needs no asset. Used in the app shell and on the landing/auth screens.
 */
export function Wordmark({
  className,
  showAcademy = true,
}: {
  className?: string;
  showAcademy?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Golden Edu Hub"
    >
      <span className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 ring-1 ring-primary/25">
        <span className="size-2 rounded-full bg-primary shadow-[0_0_10px_var(--signal)]" />
        <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight">
          Golden Edu Hub
        </span>
        {showAcademy ? (
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Golden Academy
          </span>
        ) : null}
      </span>
    </Link>
  );
}