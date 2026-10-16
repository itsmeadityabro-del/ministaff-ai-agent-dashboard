"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, UserPlus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadWebhookCard } from "@/components/LeadWebhookCard";

type LeadStatus = "new" | "qualified" | "contacted" | "booked" | "lost";
type LeadTemperature = "hot" | "warm" | "cold";
interface Lead {
  id: string; workspace_id: string; name: string; company: string | null;
  email: string | null; phone: string | null; source: string; status: LeadStatus;
  temperature: LeadTemperature; notes: string | null; created_at: string;
}
interface LeadJob {
  id: string; lead_id: string; status: "queued" | "processing" | "awaiting_review" | "completed" | "failed";
  attempt_count: number; created_at: string; updated_at: string; lead_name: string;
  lead_email: string | null; lead_source: string | null; last_error: string | null;
  result: null | { qualification?: string; temperature?: LeadTemperature; confidence?: number; summary?: string; suggested_next_step?: string; reason?: string; raw_output?: string; needs_review?: boolean };
}
const STATUSES: LeadStatus[] = ["new", "qualified", "contacted", "booked", "lost"];
const TEMPERATURES: LeadTemperature[] = ["hot", "warm", "cold"];
const statusVariant = (status: LeadStatus) =>
  status === "booked" ? "success" : status === "lost" ? "muted" : status === "qualified" ? "secondary" : "outline";
const temperatureVariant = (temperature: LeadTemperature) =>
  temperature === "hot" ? "destructive" : temperature === "warm" ? "warning" : "secondary";

export function LeadPipelineView() {
  const { current } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<LeadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("website");
  const [temperature, setTemperature] = useState<LeadTemperature>("warm");

  const load = useCallback(async () => {
    if (!current) { setLeads([]); setJobs([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [result, jobResult] = await Promise.all([
        apiFetch<{ leads: Lead[] }>(`/api/leads?workspace=${encodeURIComponent(current.id)}`),
        apiFetch<{ jobs: LeadJob[] }>(`/api/lead-jobs?workspace=${encodeURIComponent(current.id)}`),
      ]);
      setLeads(result.leads);
      setJobs(jobResult.jobs);
    } catch (error) {
      toast.error((error as Error).message || "Couldn't load leads");
    } finally {
      setLoading(false);
    }
  }, [current]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => leads.filter((lead) => {
    const haystack = [lead.name, lead.company ?? "", lead.email ?? "", lead.phone ?? "", lead.source].join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase()) && (statusFilter === "all" || lead.status === statusFilter);
  }), [leads, search, statusFilter]);

  async function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current || !name.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/api/leads", { method: "POST", body: JSON.stringify({
        workspace_id: current.id, name: name.trim(), company: company.trim() || null,
        email: email.trim() || null, phone: phone.trim() || null, source, temperature,
      }) });
      setName(""); setCompany(""); setEmail(""); setPhone("");
      toast.success("Lead added");
      await load();
    } catch (error) {
      toast.error((error as Error).message || "Couldn't add lead");
    } finally { setSaving(false); }
  }

  async function updateLead(id: string, patch: Partial<Pick<Lead, "status" | "temperature">>) {
    try {
      const result = await apiFetch<{ lead: Lead }>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setLeads((old) => old.map((lead) => lead.id === id ? result.lead : lead));
      toast.success("Lead updated");
    } catch (error) {
      toast.error((error as Error).message || "Couldn't update lead");
    }
  }

  const hotCount = leads.filter((lead) => lead.temperature === "hot" && lead.status !== "lost").length;
  const bookedCount = leads.filter((lead) => lead.status === "booked").length;
  const qualifiedCount = leads.filter((lead) => lead.status === "qualified").length;
  if (!current) return <p className="text-sm text-muted-foreground">No workspace selected.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-primary">MINISTAFF / SALES DESK</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Lead pipeline</h1><p className="mt-1 text-sm text-muted-foreground">Capture, qualify and move every enquiry toward a confirmed appointment.</p></div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Open leads" value={String(leads.filter((lead) => lead.status !== "booked" && lead.status !== "lost").length)} detail="Not closed yet" />
        <Metric label="Hot leads" value={String(hotCount)} detail="Prioritise follow-up" />
        <Metric label="Qualified" value={String(qualifiedCount)} detail={`${bookedCount} booked so far`} />
      </div>
      <LeadWebhookCard />

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div><h2 className="font-medium">Lead processing history</h2><p className="text-xs text-muted-foreground">Durable intake queue and latest job state</p></div>
          <Badge variant={jobs.some((job) => job.status === "failed") ? "destructive" : "secondary"}>{jobs.filter((job) => job.status === "queued" || job.status === "processing").length} pending</Badge>
        </div>
        {jobs.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No webhook jobs yet. Incoming events are recorded here once the webhook is configured.</p> : (
          <div className="divide-y">
            {jobs.slice(0, 8).map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{job.lead_name}</p><p className="text-xs text-muted-foreground">{job.lead_source || "webhook"} · {new Date(job.created_at).toLocaleString()} · {job.attempt_count} attempts</p>{job.result?.summary && <p className="mt-1 text-sm text-foreground">{job.result.summary}</p>}{job.result?.suggested_next_step && <p className="mt-1 text-xs text-muted-foreground">Suggested next step: {job.result.suggested_next_step}</p>}{job.result?.reason && <p className="mt-1 text-xs text-amber-700">{job.result.reason}</p>}{job.result?.raw_output && <details className="mt-1"><summary className="cursor-pointer text-xs text-muted-foreground">Review raw result</summary><pre className="mt-1 whitespace-pre-wrap break-words text-xs">{job.result.raw_output}</pre></details>}{job.last_error && <p className="mt-1 text-xs text-destructive">Latest issue: {job.last_error}</p>}</div>
                <Badge variant={job.status === "completed" ? "success" : job.status === "failed" ? "destructive" : job.status === "awaiting_review" ? "warning" : "secondary"}>{job.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        )}
        <p className="border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">Worker code is available but remains off until the deployment owner enables MINISTAFF_AUTO_TRIAGE_ENABLED. Triage results wait for human review; this worker does not send messages or book appointments.</p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company or source" className="pl-9" /></div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | LeadStatus)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b px-4 py-3"><h2 className="font-medium">Workspace leads</h2><p className="text-xs text-muted-foreground">{filtered.length} records</p></div>
            {loading ? <p className="p-8 text-sm text-muted-foreground">Loading leads…</p> : filtered.length === 0 ? <div className="p-10 text-center"><p className="font-medium">No leads match this view</p><p className="mt-1 text-sm text-muted-foreground">Add an enquiry to start your pipeline.</p></div> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Lead</th><th className="px-4 py-3 font-medium">Source</th><th className="px-4 py-3 font-medium">Priority</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
                <tbody>{filtered.map((lead) => <tr key={lead.id} className="border-t">
                  <td className="px-4 py-3"><div className="font-medium">{lead.name}</div><div className="text-xs text-muted-foreground">{lead.company || lead.email || lead.phone || "Contact details not provided"}</div></td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.source || "manual"}</td>
                  <td className="px-4 py-3"><select aria-label={`Priority for ${lead.name}`} value={lead.temperature} onChange={(event) => void updateLead(lead.id, { temperature: event.target.value as LeadTemperature })} className="h-8 rounded-md border bg-background px-2 text-xs"><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option></select><div className="mt-1"><Badge variant={temperatureVariant(lead.temperature)}>{lead.temperature}</Badge></div></td>
                  <td className="px-4 py-3"><select aria-label={`Status for ${lead.name}`} value={lead.status} onChange={(event) => void updateLead(lead.id, { status: event.target.value as LeadStatus })} className="h-8 rounded-md border bg-background px-2 text-xs"><option value="new">New</option><option value="qualified">Qualified</option><option value="contacted">Contacted</option><option value="booked">Booked</option><option value="lost">Lost</option></select><div className="mt-1"><Badge variant={statusVariant(lead.status)}>{lead.status}</Badge></div></td>
                </tr>)}</tbody>
              </table></div>
            )}
          </div>
        </section>
        <aside className="h-fit rounded-xl border bg-card p-4">
          <div className="mb-4 flex items-center gap-2"><div className="rounded-lg bg-primary/10 p-2 text-primary"><UserPlus className="h-4 w-4" /></div><div><h2 className="font-semibold">Add a lead</h2><p className="text-xs text-muted-foreground">Save an enquiry to this workspace</p></div></div>
          <form onSubmit={createLead} className="space-y-3">
            <Field label="Full name" value={name} onChange={setName} placeholder="e.g. Aisha Sharma" required />
            <Field label="Company / clinic" value={company} onChange={setCompany} placeholder="Business name" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="name@company.com" type="email" />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91…" />
            <div className="space-y-1.5"><Label htmlFor="lead-source">Source</Label><select id="lead-source" value={source} onChange={(event) => setSource(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="website">Website form</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="referral">Referral</option><option value="outbound">Outbound research</option><option value="manual">Manual entry</option></select></div>
            <div className="space-y-1.5"><Label htmlFor="lead-temperature">Priority</Label><select id="lead-temperature" value={temperature} onChange={(event) => setTemperature(event.target.value as LeadTemperature)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{TEMPERATURES.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></div>
            <Button type="submit" className="w-full" disabled={saving || !name.trim()}>{saving ? "Saving…" : "Save lead"}</Button>
            <p className="text-xs text-muted-foreground">AI qualification and automatic channel capture are separate integrations; this form records a lead only.</p>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
function Field({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} required={required} /></div>;
}
