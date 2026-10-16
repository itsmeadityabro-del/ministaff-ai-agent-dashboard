import { requireMiniStaffAccount } from "@/lib/auth";
import { isValidEmail } from "@/lib/workflow-validation.mjs";
import { ApiError, handleError, json, readJson } from "@/lib/http";

type LeadInput = { name?: unknown; email?: unknown; phone?: unknown; company?: unknown; source?: unknown; status?: unknown; notes?: unknown };
const STATUSES = ["new", "contacted", "qualified", "converted", "lost"] as const;

function optionalText(value: unknown, max: number, field: string): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new ApiError(400, "invalid_request", `${field} must be text`);
  const clean = value.trim();
  if (clean.length > max) throw new ApiError(400, "invalid_request", `${field} is too long`);
  return clean || null;
}

export async function GET() {
  try {
    const { db, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "Workspace is not ready");
    const { data, error } = await db.from("leads")
      .select("id, name, email, phone, company, source, status, notes, created_at, updated_at")
      .eq("workspace_id", account.workspace_id).order("created_at", { ascending: false }).limit(500);
    if (error) throw new ApiError(500, "db_error", error.message);
    return json({ leads: data ?? [] });
  } catch (error) { return handleError(error); }
}

export async function POST(request: Request) {
  try {
    const { db, user, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "Workspace is not ready");
    const body = await readJson<LeadInput>(request);
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 160) {
      throw new ApiError(400, "invalid_request", "A lead name of 1–160 characters is required");
    }
    const email = optionalText(body.email, 254, "Email");
    if (email && !isValidEmail(email)) throw new ApiError(400, "invalid_request", "Enter a valid email address");
    const status = body.status == null ? "new" : body.status;
    if (typeof status !== "string" || !(STATUSES as readonly string[]).includes(status)) throw new ApiError(400, "invalid_request", "Unsupported lead status");
    const { data, error } = await db.from("leads").insert({
      workspace_id: account.workspace_id, created_by: user.id, name: body.name.trim(), email,
      phone: optionalText(body.phone, 60, "Phone"), company: optionalText(body.company, 160, "Company"),
      source: optionalText(body.source, 80, "Source") ?? "manual", status,
      notes: optionalText(body.notes, 5000, "Notes"),
    }).select("*").single();
    if (error) throw new ApiError(500, "db_error", error.message);
    return json({ lead: data }, 201);
  } catch (error) { return handleError(error); }
}
