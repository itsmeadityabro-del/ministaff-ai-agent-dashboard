"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Coins, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MergedAgent, Usage } from "@/lib/types";

interface AgentUsageRow { agent: MergedAgent; usage: Usage | null; error: string | null; }
const currentMonth = () => new Date().toISOString().slice(0, 7);
const usd = (micros: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(micros / 1_000_000);
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

export function UsageView() {
  const { current } = useWorkspace();
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<AgentUsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!current) { setRows([]); setLoading(false); return; }
    setLoading(true);
    try {
      const result = await apiFetch<{ agents: MergedAgent[] }>(`/api/agents?workspace=${encodeURIComponent(current.id)}`);
      const usageRows = await Promise.all(result.agents.map(async (agent) => {
        try {
          const usage = await apiFetch<Usage>(`/api/agents/${encodeURIComponent(agent.agent37_id)}/usage?month=${encodeURIComponent(month)}`);
          return { agent, usage, error: null } satisfies AgentUsageRow;
        } catch (error) {
          return { agent, usage: null, error: (error as Error).message || "Usage unavailable" } satisfies AgentUsageRow;
        }
      }));
      setRows(usageRows);
    } catch (error) {
      toast.error((error as Error).message || "Couldn't load usage");
    } finally { setLoading(false); }
  }, [current, month]);
  useEffect(() => { void load(); }, [load]);

  const totalMicros = rows.reduce((sum, row) => sum + (row.usage?.total_micros ?? 0), 0);
  const inputTokens = rows.reduce((sum, row) => sum + (row.usage?.by_integration.llm.input_tokens ?? 0), 0);
  const outputTokens = rows.reduce((sum, row) => sum + (row.usage?.by_integration.llm.output_tokens ?? 0), 0);
  const calls = rows.reduce((sum, row) => sum + (row.usage?.by_integration.llm.calls ?? 0), 0);
  const availableRows = rows.filter((row) => row.usage !== null).length;
  if (!current) return <p className="text-sm text-muted-foreground">No workspace selected.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-primary">MINISTAFF / COST CONTROL</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Usage & tokens</h1><p className="mt-1 text-sm text-muted-foreground">Monthly model usage and Agent37 spend, broken down by agent.</p></div>
        <div className="flex gap-2"><input aria-label="Usage month" type="month" value={month} max={currentMonth()} onChange={(event) => setMonth(event.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm" /><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Coins className="h-4 w-4" />} label="Tracked spend" value={usd(totalMicros)} detail="Agent37-reported usage for selected month" />
        <Metric icon={<Zap className="h-4 w-4" />} label="Input tokens" value={number(inputTokens)} detail="Model usage reported by agents" />
        <Metric icon={<Activity className="h-4 w-4" />} label="Output tokens" value={number(outputTokens)} detail={`${number(inputTokens + outputTokens)} total tokens`} />
        <Metric icon={<Activity className="h-4 w-4" />} label="LLM calls" value={number(calls)} detail={`${availableRows} of ${rows.length} agent reports available`} />
      </div>
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-3"><h2 className="font-medium">Agent usage</h2><p className="text-xs text-muted-foreground">Provider usage is the source of truth where available.</p></div>
        {loading ? <p className="p-8 text-sm text-muted-foreground">Loading usage…</p> : rows.length === 0 ? <div className="p-10 text-center"><p className="font-medium">No agents in this workspace</p><p className="mt-1 text-sm text-muted-foreground">Create an agent to begin tracking provider-reported usage.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Agent</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Input</th><th className="px-4 py-3 font-medium">Output</th><th className="px-4 py-3 font-medium">LLM calls</th><th className="px-4 py-3 text-right font-medium">Reported cost</th></tr></thead>
            <tbody>{rows.map(({ agent, usage, error }) => <tr key={agent.agent37_id} className="border-t">
              <td className="px-4 py-3"><div className="font-medium">{agent.name || "Unnamed agent"}</div><div className="text-xs text-muted-foreground">{agent.agent37_id.slice(0, 12)}…</div></td>
              <td className="px-4 py-3"><Badge variant={agent.live_status === "running" ? "success" : "secondary"}>{agent.live_status || "unknown"}</Badge></td>
              <td className="px-4 py-3 tabular-nums">{usage ? number(usage.by_integration.llm.input_tokens) : "—"}</td>
              <td className="px-4 py-3 tabular-nums">{usage ? number(usage.by_integration.llm.output_tokens) : "—"}</td>
              <td className="px-4 py-3 tabular-nums">{usage ? number(usage.by_integration.llm.calls) : "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums">{usage ? usd(usage.total_micros) : <span className="text-xs text-muted-foreground">{error || "Unavailable"}</span>}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
      <div className="rounded-xl border border-dashed p-4">
        <h2 className="font-medium">Quota enforcement is not enabled yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">This screen reports usage returned by Agent37. Workspace-level token quotas, BYOK separation and hard budget enforcement require plan rules and a usage ledger before they can be safely enforced.</p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-muted-foreground">{icon}<p className="text-sm">{label}</p></div><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
