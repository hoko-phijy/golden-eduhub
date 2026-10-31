import { NextResponse } from "next/server";

/**
 * Platform health check (docs/08-deployment-railway.md §11).
 * Cheap, unauthenticated, and used by Railway to decide whether a deploy is live.
 * The DB probe is added in Phase 1 when the Prisma client exists.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    version: process.env.npm_package_version ?? "0.1.0",
    db: "not_configured",
    time: new Date().toISOString(),
  });
}