import { requireAdmin, requireUser } from "@/lib/auth";
import { ApiError, handleError, json, readJson } from "@/lib/http";
import { createWebhookSecret, hashWebhookSecret } from "@/lib/webhook-secret";

export async function GET(request: Request) {
  try {
    const { db, user } = await requireUser();
    const workspaceId = new URL(request.url).searchParams.get("workspace");
    if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace query param is required");
    await requireAdmin(db, workspaceId, user.id);
    const { data, error } = await db.from("lead_webhook_keys")
      .select("created_at,updated_at,last_used_at").eq("workspace_id", workspaceId).maybeSingle();
    if (error) throw new ApiError(500, "db_error", error.message);
    const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
    return json({
      configured: !!data,
      endpoint: origin + "/api/webhooks/leads/" + workspaceId,
      created_at: data?.created_at ?? null,
      updated_at: data?.updated_at ?? null,
      last_used_at: data?.last_used_at ?? null,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, user } = await requireUser();
    const body = await readJson<{ workspace_id?: string }>(request);
    const workspaceId = body.workspace_id?.trim();
    if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace_id is required");
    await requireAdmin(db, workspaceId, user.id);

    const secret = createWebhookSecret();
    const tokenHash = await hashWebhookSecret(secret);
    const { error } = await db.from("lead_webhook_keys").upsert({
      workspace_id: workspaceId,
      token_hash: tokenHash,
      updated_at: new Date().toISOString(),
    }, { onConflict: "workspace_id" });
    if (error) throw new ApiError(500, "db_error", error.message);

    const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
    return json({
      secret,
      endpoint: origin + "/api/webhooks/leads/" + workspaceId,
      warning: "Copy this secret now. It is not stored in plaintext and cannot be shown again. Rotating the secret immediately invalidates the previous one.",
    }, 201);
  } catch (error) {
    return handleError(error);
  }
}
