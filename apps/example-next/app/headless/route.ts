import { buildInitialPayload } from "../../lib/server-contract.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public synthetic read only; scope labels below are not backend authorization. */
export function GET(request: Request): Response {
  const instance =
    new URL(request.url).searchParams.get("instance") ?? "primary";
  const headers = { "Cache-Control": "no-store" };
  if (instance !== "primary" && instance !== "comparison") {
    return Response.json(
      { error: "Unsupported public example instance." },
      { status: 400, headers },
    );
  }
  return Response.json(buildInitialPayload(instance), { headers });
}
