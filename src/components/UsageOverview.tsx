"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Coins, RefreshCw, Gauge } from "lucide-react";

type UsageResponse = {
  plan: "plus" | "pro" | "max";
  entitlement_status: string;
  agent: { id: string; status: string; past_due: boolean };
  budget: { monthly_cap_micros: number; monthly_consumed_micros: number; monthly_remaining_micros: number; monthly_period: string; credit_remaining_micros: number };
  usage: { period: string; total_micros: number; llm_input_tokens: number; llm_output_tokens: number; llm_calls: number };
};
const usd = (micros: number) => new Intl.NumberFormat(undefined,{style:"currency",currency:"USD",maximumFractionDigits:2}).format(micros/1_000_000);
const count = (value: number) => new Intl.NumberFormat().format(value);

export function UsageOverview() {
  const [data,setData]=useState<UsageResponse|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{const res=await fetch("/api/usage",{cache:"no-store"});const body=await res.json();if(!res.ok)throw new Error(body?.error?.message||"Could not load usage");setData(body);}
    catch(e){setError(e instanceof Error?e.message:"Could not load usage");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  const cap=data?.budget.monthly_cap_micros??0;
  const spent=data?.budget.monthly_consumed_micros??0;
  const pct=cap>0?Math.min(100,Math.max(0,spent/cap*100)):0;
  const totalTokens=(data?.usage.llm_input_tokens??0)+(data?.usage.llm_output_tokens??0);

  return <section className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-muted-foreground">Account health</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Usage & activity</h1><p className="mt-2 text-sm text-muted-foreground">Usage reported by the connected agent provider. Figures update when you refresh.</p></div><button onClick={()=>void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} className={loading?"animate-spin":""}/> Refresh</button></header>
    {error&&<div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">{error}</div>}
    {loading&&!data?<div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">Loading live usage…</div>:data&&<>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Activity size={16}/> Agent status</div><p className="mt-3 text-2xl font-semibold capitalize">{data.agent.status.replaceAll("_"," ")}</p><p className="mt-1 text-xs text-muted-foreground">{data.agent.past_due?"Payment attention required":"Status reported by Agent37"}</p></div>
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Gauge size={16}/> Managed spend</div><p className="mt-3 text-2xl font-semibold">{usd(spent)}</p><p className="mt-1 text-xs text-muted-foreground">{cap>0?`of ${usd(cap)} provider budget`:"No managed monthly cap reported"}</p></div>
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Coins size={16}/> LLM tokens</div><p className="mt-3 text-2xl font-semibold">{count(totalTokens)}</p><p className="mt-1 text-xs text-muted-foreground">{count(data.usage.llm_input_tokens)} input · {count(data.usage.llm_output_tokens)} output</p></div>
        <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Activity size={16}/> Model calls</div><p className="mt-3 text-2xl font-semibold">{count(data.usage.llm_calls)}</p><p className="mt-1 text-xs text-muted-foreground">Period: {data.usage.period}</p></div>
      </div>
      <div className="rounded-xl border bg-card p-5 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Managed budget</h2><p className="text-sm text-muted-foreground">Plan: {data.plan.toUpperCase()} · {data.entitlement_status}</p></div><p className="text-sm font-medium">{cap>0?`${pct.toFixed(1)}% used`:"Not available"}</p></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${pct>=90?"bg-destructive":"bg-primary"}`} style={{width:`${pct}%`}}/></div><div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground"><span>Consumed: {usd(spent)}</span><span>Reported remaining: {usd(data.budget.monthly_remaining_micros)}</span></div><p className="text-xs text-muted-foreground">The provider enforces the returned managed-spend budget. This view does not independently block requests and does not include external BYOK subscription usage.</p></div>
    </>}
  </section>;
}
