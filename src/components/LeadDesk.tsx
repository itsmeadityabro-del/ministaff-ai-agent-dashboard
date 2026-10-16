"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Users, X } from "lucide-react";

type Lead = {
  id: string; name: string; email: string | null; phone: string | null; company: string | null;
  source: string; status: "new" | "contacted" | "qualified" | "converted" | "lost";
  notes: string | null; created_at: string;
};
const statuses: Lead["status"][] = ["new", "contacted", "qualified", "converted", "lost"];

export function LeadDesk() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", source: "manual", notes: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not load leads");
      setLeads(data.leads ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load leads"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not save lead");
      setLeads((current) => [data.lead, ...current]);
      setForm({ name: "", email: "", phone: "", company: "", source: "manual", notes: "" });
      setShowForm(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save lead"); }
    finally { setSaving(false); }
  }

  async function updateStatus(lead: Lead, status: Lead["status"]) {
    setError("");
    try {
      const response = await fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not update lead");
      setLeads((current) => current.map((item) => item.id === lead.id ? data.lead : item));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update lead"); }
  }

  async function deleteLead(lead: Lead) {
    if (!window.confirm(`Delete lead “${lead.name}”?`)) return;
    try {
      const response = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not delete lead");
      setLeads((current) => current.filter((item) => item.id !== lead.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not delete lead"); }
  }

  const filtered = leads.filter((lead) => [lead.name, lead.email, lead.company, lead.phone, lead.source].some((value) => value?.toLowerCase().includes(query.toLowerCase())));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-medium text-muted-foreground">Customer workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Leads</h1><p className="mt-2 text-sm text-muted-foreground">Keep contacts organized from first touch to conversion.</p></div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">{showForm ? <X size={16}/> : <Plus size={16}/>} {showForm ? "Close" : "Add lead"}</button>
      </header>
      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">{error}</div>}
      {showForm && <form onSubmit={createLead} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-sm">Name *<input required maxLength={160} value={form.name} onChange={(e) => setForm({...form,name:e.target.value})} className="w-full rounded-md border bg-background px-3 py-2"/></label>
        <label className="space-y-1 text-sm">Email<input type="email" maxLength={254} value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} className="w-full rounded-md border bg-background px-3 py-2"/></label>
        <label className="space-y-1 text-sm">Phone<input maxLength={60} value={form.phone} onChange={(e) => setForm({...form,phone:e.target.value})} className="w-full rounded-md border bg-background px-3 py-2"/></label>
        <label className="space-y-1 text-sm">Company<input maxLength={160} value={form.company} onChange={(e) => setForm({...form,company:e.target.value})} className="w-full rounded-md border bg-background px-3 py-2"/></label>
        <label className="space-y-1 text-sm">Source<input maxLength={80} value={form.source} onChange={(e) => setForm({...form,source:e.target.value})} className="w-full rounded-md border bg-background px-3 py-2"/></label>
        <label className="space-y-1 text-sm sm:col-span-2 lg:col-span-3">Notes<textarea maxLength={5000} rows={2} value={form.notes} onChange={(e) => setForm({...form,notes:e.target.value})} className="w-full rounded-md border bg-background px-3 py-2"/></label>
        <div className="sm:col-span-2 lg:col-span-3"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save lead"}</button></div>
      </form>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Total leads</p><p className="mt-2 text-2xl font-semibold">{leads.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">In progress</p><p className="mt-2 text-2xl font-semibold">{leads.filter((l) => ["new","contacted","qualified"].includes(l.status)).length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Converted</p><p className="mt-2 text-2xl font-semibold">{leads.filter((l) => l.status === "converted").length}</p></div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3"><Search size={16} className="text-muted-foreground"/><input aria-label="Search leads" placeholder="Search name, company, email…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none"/></div>
      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? <p className="p-6 text-sm text-muted-foreground">Loading leads…</p> : filtered.length === 0 ? <div className="flex flex-col items-center gap-2 p-10 text-center"><Users className="text-muted-foreground" size={28}/><p className="font-medium">{query ? "No matching leads" : "No leads yet"}</p><p className="text-sm text-muted-foreground">Add a contact to start building your pipeline.</p></div> : <div className="divide-y">
          {filtered.map((lead) => <article key={lead.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_170px_85px] md:items-center">
            <div className="min-w-0"><p className="truncate font-medium">{lead.name}</p><p className="mt-1 truncate text-sm text-muted-foreground">{[lead.company,lead.email,lead.phone].filter(Boolean).join(" · ") || "No contact details"}</p><p className="mt-1 text-xs text-muted-foreground">Source: {lead.source || "manual"} · Added {new Date(lead.created_at).toLocaleDateString()}</p></div>
            <select aria-label={`Status for ${lead.name}`} value={lead.status} onChange={(e) => void updateStatus(lead,e.target.value as Lead["status"])} className="rounded-md border bg-background px-2 py-2 text-sm">{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase()+status.slice(1)}</option>)}</select>
            <button onClick={() => void deleteLead(lead)} className="text-left text-sm text-muted-foreground hover:text-destructive md:text-right">Delete</button>
          </article>)}
        </div>}
      </div>
    </section>
  );
}
