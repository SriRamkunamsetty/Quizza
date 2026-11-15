import type { NextRequest } from "next/server";
import { handle, json, HttpError } from "@/lib/api/http";
import { getFiftyFiftyElimination } from "@/lib/sessions";

type Ctx = { params: Promise<{ code: string; questionId: string }> };

export const GET = handle<Ctx>(async (req: NextRequest, { params }) => {
  const clientToken = req.headers.get("x-client-token");
  if (!clientToken) {
    throw new HttpError(401, "missing_token", "Client token required");
  }
  const { code, questionId } = await params;
  const result = await getFiftyFiftyElimination(code, questionId, clientToken);
  return json(result);
});
