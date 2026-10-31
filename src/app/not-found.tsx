import Link from "next/link";

/**
 * Root not-found. Rendered outside the locale providers, so it is intentionally
 * language-neutral: showing English here to an Arabic user would be worse than a symbol.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-mono text-6xl font-semibold text-signal">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        That page doesn&apos;t exist, or you don&apos;t have access to it.
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-signal underline underline-offset-4"
      >
        Go to Golden Edu Hub
      </Link>
    </main>
  );
}