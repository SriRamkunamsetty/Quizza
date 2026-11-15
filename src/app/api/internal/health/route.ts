import type { NextRequest } from "next/server";
import { runHealthDiagnostics } from "@/lib/diagnostics";

export async function GET(request: NextRequest) {
  const expected = process.env.INTERNAL_HEALTH_SECRET;
  const supplied =
    request.headers.get("x-internal-health-secret") ??
    request.nextUrl.searchParams.get("secret");

  // If a secret is required and not supplied, return basic liveness or 401
  if (expected && supplied !== expected) {
    // Return lightweight unauthenticated liveness probe
    return Response.json(
      { ok: true, status: "alive" },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  const diagnostics = await runHealthDiagnostics();

  return Response.json(diagnostics, {
    status: diagnostics.ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
