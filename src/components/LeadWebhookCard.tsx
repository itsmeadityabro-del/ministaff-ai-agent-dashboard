"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clipboard, KeyRound, RefreshCw, Webhook } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WebhookConfig {
  configured: boolean;
  endpoint: string;
  created_at: string | null;
  updated_at: string | null;
  last_used_at: string | null;
}
interface IssuedKey { secret: string; endpoint: string; warning: string; }

export function LeadWebhookCard() {
  const { current } = useWorkspace();
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [issued, setIssued] = useState<IssuedKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState<"secret" | "endpoint" | null>(null);

  const load = useCallback(async () => {
    if (!current) { setConfig(null); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await apiFetch<WebhookConfig>("/api/webhooks/leads/config?workspace=" + encodeURIComponent(current.id));
      setConfig(result);
    } catch (error) {
      toast.error((error as Error).message || "Couldn't load webhook settings");
    } finally { setLoading(false); }
  }, [current]);

  useEffect(() => { setIssued(null); void load(); }, [load]);

  async function rotateKey() {
    if (!current) return;
    setRotating(true);
    try {
      const result = await apiFetch<IssuedKey>("/api/webhooks/leads/config", {
        method: "POST",
        body: JSON.stringify({ workspace_id: current.id }),
      });
      setIssued(result);
      setConfig((old) => old ? { ...old, configured: true, endpoint: result.endpoint } : {
        configured: true, endpoint: result.endpoint, created_at: null, updated_at: null, last_used_at: null,
      });
      setCopied(null);
      toast.success("New webhook key issued. Copy it now.");
    } catch (error) {
      toast.error((error as Error).message || "Couldn't create webhook key");
    } finally { setRotating(false); }
  }

  async function copy(value: string, which: "secret" | "endpoint") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      toast.success(which === "secret" ? "Secret copied" : "Endpoint copied");
    } catch {
      toast.error("Clipboard permission was denied. Select and copy the text manually.");
    }
  }

  if (!current) return null;
  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Webhook className="h-5 w-5" /></div>
          <div><h2 className="font-semibold">Website & channel intake</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">Connect forms or backend webhooks to save a lead and durable processing job before any agent wake-up is attempted.</p></div>
        </div>
        <Badge variant={config?.configured ? "success" : "secondary"}>{loading ? "Checking…" : config?.configured ? "Configured" : "Not configured"}</Badge>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-medium">Endpoint</p>
          <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs">{config?.endpoint || "Available after configuration"}</code>
          {config?.last_used_at && <p className="text-xs text-muted-foreground">Last received a lead: {new Date(config.last_used_at).toLocaleString()}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {config?.endpoint && <Button variant="outline" size="sm" onClick={() => void copy(config.endpoint, "endpoint")}><Clipboard className="h-4 w-4" /> {copied === "endpoint" ? "Copied" : "Copy endpoint"}</Button>}
          <Button size="sm" onClick={() => void rotateKey()} disabled={rotating || loading}><KeyRound className="h-4 w-4" /> {rotating ? "Generating…" : config?.configured ? "Rotate secret" : "Create webhook secret"}</Button>
          <Button variant="ghost" size="icon" aria-label="Refresh webhook status" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {issued && (
        <div className="mt-4 space-y-3 rounded-lg border border-amber-300/60 p-3">
          <div className="flex items-start gap-2"><KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><p className="text-sm font-semibold">Copy this secret now</p><p className="text-xs text-muted-foreground">{issued.warning}</p></div></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 select-all break-all rounded-md bg-muted px-3 py-2 text-xs">{issued.secret}</code>
            <Button variant="outline" size="sm" onClick={() => void copy(issued.secret, "secret")}><Clipboard className="h-4 w-4" /> {copied === "secret" ? <Check className="h-4 w-4" /> : "Copy secret"}</Button>
          </div>
          <p className="text-xs text-muted-foreground">Send POST JSON to the endpoint with header <code>x-ministaff-webhook-secret</code>. Also send a stable <code>Idempotency-Key</code> per source event so retries do not create duplicate leads. The key is stored hashed, never plaintext.</p>
        </div>
      )}
      {!issued && <p className="mt-3 text-xs text-muted-foreground">This endpoint only accepts authenticated intake. It does not send messages to leads, book calendar slots, or claim AI qualification has completed.</p>}
    </section>
  );
}
