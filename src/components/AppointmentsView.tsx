"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { apiFetch } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
interface LeadOption { id: string; name: string; }
interface Appointment {
  id: string; workspace_id: string; lead_id: string | null; lead_name: string | null;
  title: string; starts_at: string; ends_at: string; status: AppointmentStatus;
  location: string | null; notes: string | null; created_at: string;
}
const statusVariant = (status: AppointmentStatus) =>
  status === "confirmed" || status === "completed" ? "success" : status === "cancelled" ? "muted" : "warning";
const localDateTime = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const prettyDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function AppointmentsView() {
  const { current } = useWorkspace();
  const [items, setItems] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [leadId, setLeadId] = useState("");
  const [startsAt, setStartsAt] = useState(localDateTime(new Date(Date.now() + 3600000)));
  const [endsAt, setEndsAt] = useState(localDateTime(new Date(Date.now() + 5400000)));
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!current) { setItems([]); setLeads([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [appointmentResult, leadResult] = await Promise.all([
        apiFetch<{ appointments: Appointment[] }>(`/api/appointments?workspace=${encodeURIComponent(current.id)}`),
        apiFetch<{ leads: LeadOption[] }>(`/api/leads?workspace=${encodeURIComponent(current.id)}`),
      ]);
      setItems(appointmentResult.appointments);
      setLeads(leadResult.leads.map(({ id, name }) => ({ id, name })));
    } catch (error) {
      toast.error((error as Error).message || "Couldn't load appointments");
    } finally { setLoading(false); }
  }, [current]);
  useEffect(() => { void load(); }, [load]);

  const upcoming = items.filter((item) => item.status !== "cancelled" && new Date(item.starts_at).getTime() >= Date.now());
  const confirmed = items.filter((item) => item.status === "confirmed").length;

  async function createAppointment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!current || !title.trim()) return;
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      toast.error("End time must be after the start time");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/appointments", { method: "POST", body: JSON.stringify({
        workspace_id: current.id, title: title.trim(), lead_id: leadId || null,
        starts_at: start.toISOString(), ends_at: end.toISOString(),
        location: location.trim() || null, notes: notes.trim() || null,
      }) });
      setTitle(""); setLeadId(""); setLocation(""); setNotes("");
      toast.success("Appointment saved as pending");
      await load();
    } catch (error) {
      toast.error((error as Error).message || "Couldn't create appointment");
    } finally { setSaving(false); }
  }

  async function changeStatus(id: string, status: AppointmentStatus) {
    try {
      const result = await apiFetch<{ appointment: Appointment }>(`/api/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setItems((old) => old.map((item) => item.id === id ? result.appointment : item));
      toast.success(`Appointment marked ${status}`);
    } catch (error) {
      toast.error((error as Error).message || "Couldn't update appointment");
    }
  }

  if (!current) return <p className="text-sm text-muted-foreground">No workspace selected.</p>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-primary">MINISTAFF / SCHEDULING</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Appointments</h1><p className="mt-1 text-sm text-muted-foreground">Record booking requests, confirm them manually and keep the lead timeline together.</p></div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Upcoming" value={String(upcoming.length)} detail="Future, non-cancelled appointments" />
        <Metric label="Confirmed" value={String(confirmed)} detail="Confirmed by a workspace member" />
        <Metric label="Needs action" value={String(items.filter((item) => item.status === "pending").length)} detail="Pending confirmation" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-4 py-3"><h2 className="font-medium">Booking schedule</h2><p className="text-xs text-muted-foreground">Appointments in this workspace</p></div>
          {loading ? <p className="p-8 text-sm text-muted-foreground">Loading appointments…</p> : items.length === 0 ? (
            <div className="p-10 text-center"><CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">No appointments yet</p><p className="mt-1 text-sm text-muted-foreground">Create a booking record using the form.</p></div>
          ) : <div className="divide-y">{items.map((item) => <div key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{item.title}</h3><Badge variant={statusVariant(item.status)}>{item.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{prettyDate(item.starts_at)} – {prettyDate(item.ends_at)}</p><p className="mt-1 text-sm">{item.lead_name || "No linked lead"}{item.location ? ` · ${item.location}` : ""}</p>{item.notes && <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>}</div>
            <div className="flex shrink-0 flex-wrap gap-2">{item.status === "pending" && <Button size="sm" onClick={() => void changeStatus(item.id, "confirmed")}>Confirm</Button>}{item.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => void changeStatus(item.id, "completed")}>Complete</Button>}{item.status !== "cancelled" && item.status !== "completed" && <Button size="sm" variant="outline" onClick={() => void changeStatus(item.id, "cancelled")}>Cancel</Button>}</div>
          </div>)}</div>}
        </section>
        <aside className="h-fit rounded-xl border bg-card p-4">
          <div className="mb-4"><h2 className="font-semibold">Create appointment</h2><p className="text-xs text-muted-foreground">Saved as pending until you confirm it</p></div>
          <form onSubmit={createAppointment} className="space-y-3">
            <Field id="appointment-title" label="Appointment title"><Input id="appointment-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Initial consultation" required /></Field>
            <Field id="appointment-lead" label="Link a lead"><select id="appointment-lead" value={leadId} onChange={(event) => setLeadId(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">No linked lead</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select></Field>
            <Field id="appointment-start" label="Starts at"><Input id="appointment-start" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></Field>
            <Field id="appointment-end" label="Ends at"><Input id="appointment-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} required /></Field>
            <Field id="appointment-location" label="Location / meeting link"><Input id="appointment-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Office, clinic or video link" /></Field>
            <Field id="appointment-notes" label="Notes"><textarea id="appointment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Context for the appointment" /></Field>
            <Button type="submit" className="w-full" disabled={saving || !title.trim()}>{saving ? "Saving…" : "Create appointment"}</Button>
            <p className="text-xs text-muted-foreground">This MVP records appointments but does not check an external calendar or send booking confirmations.</p>
          </form>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
