import { NextResponse } from "next/server";
import { Agent37Error } from "@/lib/agent37";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

const DEFAULT_JSON_BODY_LIMIT = 1_048_576; // 1 MiB

export async function readJson<T = Record<string, unknown>>(
  request: Request,
  maxBytes = DEFAULT_JSON_BODY_LIMIT,
): Promise<T> {
  const limit = Number.isSafeInteger(maxBytes) && maxBytes > 0
    ? maxBytes
    : DEFAULT_JSON_BODY_LIMIT;
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > limit) {
    throw new ApiError(413, "payload_too_large", "Request body is too large");
  }

  if (!request.body) return {} as T;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel().catch(() => {});
        throw new ApiError(413, "payload_too_large", "Request body is too large");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "invalid_request", "Unable to read request body");
  }

  if (total === 0) return {} as T;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    // Preserve the existing API contract: individual routes validate required fields and
    // return a typed 400, rather than leaking parser details for malformed JSON.
    return {} as T;
  }
}

export function apiError(message: string, status = 400, code = "error") {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function handleError(e: unknown) {
  if (e instanceof ApiError) {
    // Database clients can include schema/table/constraint details in error.message. Keep the
    // structured status and code for callers, but don't disclose internal SQL diagnostics.
    const message = e.status >= 500 && e.code === "db_error"
      ? "A database operation failed. Please retry."
      : e.message;
    return apiError(message, e.status, e.code);
  }
  if (e instanceof Agent37Error) {
    // Preserve useful provider diagnostics while ensuring bearer/API credentials can never be
    // reflected in a user-visible error payload.
    const message = e.message
      .replace(/sk_live_[A-Za-z0-9_-]+/g, "[redacted]")
      .replace(/Bearer\\s+\\S+/gi, "Bearer [redacted]")
      .replace(/((?:api[_ -]?key|token)\\s*[:=]\\s*)\\S+/gi, "$1[redacted]")
      .slice(0, 400);
    return apiError(message, e.status, e.code);
  }
  console.error("[api]", e);
  return apiError("Internal server error", 500, "internal_error");
}
