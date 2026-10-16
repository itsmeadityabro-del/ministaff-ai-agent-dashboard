"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { agentTabPath } from "@/lib/dashboard-tabs";
import type { MergedAgent, Role } from "@/lib/types";

export function AgentsView() {
  const { current } = useWorkspace();
  const [agents, setAgents] = useState<MergedAgent[]>([]);
  const [role, setRole] = useState<Role>("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!current) return;
    setError("");
    try {
      const data = await apiFetch<{ agents: MergedAgent[]; role: Role }>(`/api/agents?workspace=${current.id}`);
      setAgents(data.agents);
      setRole(data.role);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your staffer");
    } finally {
      setLoading(false);
    }
  }, [current]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!agents.some((a) => ["provisioning", "starting", "stopping", "restarting"].includes(a.live_status ?? ""))) return;
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [agents, load]);

  if (!current) return <p className="text-sm text-muted-foreground">Your MiniStaff workspace is not ready yet.</p>;

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium text-muted-foreground">Your workspace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">My staffer</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your managed AI assistant, status and workspace tools.</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">{error}</div>}
      {loading ? <p className="text-sm text-muted-foreground">Loading your staffer…</p>
        : agents.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <Bot className="mx-auto text-muted-foreground" size={30}/>
            <p className="mt-3 font-medium">Your staffer is not linked yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Complete activation with the email used for your purchase. If activation is already complete, contact support.</p>
            <button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw size={14}/> Refresh</button>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => (
              <article key={agent.agent37_id} className="rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{agent.name || "My MiniStaff staffer"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{agent.template || "Managed AI agent"}</p>
                    <p className="mt-3 text-sm">Status: <span className="font-medium capitalize">{(agent.live_status ?? agent.status ?? "unknown").replaceAll("_"," ")}</span></p>
                    {agent.status_reason?.message && <p className="mt-1 text-sm text-muted-foreground">{agent.status_reason.message}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">Resources: {agent.cpu ?? "—"} vCPU · {agent.memory ?? "—"} GB RAM · {agent.disk ?? "—"} GB disk</p>
                    {agent.past_due && <p className="mt-2 text-sm text-destructive">Payment or managed budget needs attention.</p>}
                  </div>
                  <Link href={agentTabPath(agent.agent37_id, "chat")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Open staffer</Link>
                </div>
              </article>
            ))}
            <div className="flex justify-end">
              <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RefreshCw size={14}/> Refresh status</button>
            </div>
          </div>
        )}
      {role !== "admin" && <p className="text-xs text-muted-foreground">Workspace read-only access.</p>}
    </section>
  );
}
