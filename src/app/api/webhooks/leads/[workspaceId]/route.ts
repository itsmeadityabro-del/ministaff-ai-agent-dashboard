import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError, handleError, json, readJson } from "@/lib/http";
import { hashWebhookSecret } from "@/lib/webhook-secret";

type Ctx = { params: Promise<{ workspaceId: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SOURCES = new Set(["website", "whatsapp", "instagram", "referral", "outbound", "manual", "webhook"]);
const TEMPERATURES = new Set(["hot", "warm", "cold"]);

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { workspaceId } = await params;
    if (!UUID.test(workspaceId)) throw new ApiError(404, "not_found", "Webhook endpoint not found");
    const secret = request.headers.get("x-ministaff-webhook-secret");
    if (!secret || secret.length < 32 || secret.length > 256) {
      throw new ApiError(401, "unauthorized", "Valid webhook credentials are required");
    }

    const body = await readJson<{
      name?: string; company?: string; email?: string; phone?: string;
      source?: string; temperature?: string; event_id?: string;
    }>(request, 16_384);
    const name = body.name?.trim() ?? "";
    if (!name || name.length > 160) {
      throw new ApiError(400, "invalid_request", "name is required and must be 160 characters or fewer");
    }
    if (body.email && body.email.length > 320) throw new ApiError(400, "invalid_request", "email is too long");
    if (body.phone && body.phone.length > 80) throw new ApiError(400, "invalid_request", "phone is too long");
    if (body.company && body.company.length > 200) throw new ApiError(400, "invalid_request", "company is too long");

    const headerEventId = request.headers.get("idempotency-key")?.trim();
    const eventId = headerEventId || body.event_id?.trim() || null;
    if (eventId && eventId.length > 200) throw new ApiError(400, "invalid_request", "Idempotency key is too long");
    const source = body.source && SOURCES.has(body.source) ? body.source : "website";
    const temperature = body.temperature && TEMPERATURES.has(body.temperature) ? body.temperature : "warm";
    const secretHash = await hashWebhookSecret(secret);
    const db = createAdminClient();
    const { data, error } = await db.rpc("ingest_lead_event", {
      p_workspace_id: workspaceId,
      p_secret_hash: secretHash,
      p_name: name,
      p_company: body.company?.trim() || null,
      p_email: body.email?.trim() || null,
      p_phone: body.phone?.trim() || null,
      p_source: source,
      p_temperature: temperature,
      p_idempotency_key: eventId,
    });

    if (error) {
      if (error.code === "42501" || /invalid webhook secret/i.test(error.message)) {
        throw new ApiError(401, "unauthorized", "Invalid or rotated webhook credentials");
      }
      if (error.code === "22023") throw new ApiError(400, "invalid_request", "Invalid lead payload");
      throw new ApiError(500, "ingestion_failed", "Lead could not be saved; retry this request using the same idempotency key");
    }
    const row = (Array.isArray(data) ? data[0] : data) as { lead_id: string; job_id: string; duplicate: boolean } | null;
    if (!row?.lead_id || !row?.job_id) throw new ApiError(500, "ingestion_failed", "Lead intake returned an incomplete result");
    return json({
      accepted: true,
      lead_id: row.lead_id,
      job_id: row.job_id,
      duplicate: row.duplicate,
      processing_status: "queued",
      message: row.duplicate ? "This event was already accepted." : "Lead saved and queued for background processing.",
      note: eventId ? undefined : "Supply the Idempotency-Key header for safe retry deduplication.",
    }, row.duplicate ? 200 : 202);
  } catch (error) {
    return handleError(error);
  }
}
