"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Pencil, Plus, Save, X } from "lucide-react";

type LeadOption = { id: string; name: string };
type Appointment = {
  id: string; lead_id: string | null; title: string; starts_at: string; ends_at: string;
  timezone: string; status: "scheduled" | "completed" | "cancelled"; notes: string | null;
  leads?: { name: string } | null;
};
type AppointmentForm = {
  title: string; lead_id: string; starts_at: string; ends_at: string;
  timezone: string; status: Appointment["status"]; notes: string;
};
function localInputDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
function fmt(value: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, { timeZone: timezone, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
const inputClass = "w-full rounded-md border bg-background px-3 py-2";
const statuses: Appointment["status"][] = ["scheduled", "completed", "cancelled"];

export function AppointmentDesk() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [appointments,setAppointments] = useState<Appointment[]>([]);
  const [leads,setLeads] = useState<LeadOption[]>([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [showForm,setShowForm] = useState(false);
  const [editingId,setEditingId] = useState<string|null>(null);
  const [form,setForm] = useState({title:"",lead_id:"",starts_at:localInputDate(new Date(Date.now()+60*60*1000)),ends_at:localInputDate(new Date(Date.now()+90*60*1000)),notes:""});
  const [editForm,setEditForm] = useState<AppointmentForm>({
    title:"",lead_id:"",starts_at:"",ends_at:"",timezone,status:"scheduled",notes:"",
  });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [a,l] = await Promise.all([fetch("/api/appointments",{cache:"no-store"}),fetch("/api/leads",{cache:"no-store"})]);
      const [ad,ld] = await Promise.all([a.json(),l.json()]);
      if (!a.ok) throw new Error(ad?.error?.message || "Could not load appointments");
      if (!l.ok) throw new Error(ld?.error?.message || "Could not load leads");
      setAppointments(ad.appointments ?? []);
      setLeads((ld.leads ?? []).map((x:LeadOption)=>({id:x.id,name:x.name})));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load appointments"); }
    finally { setLoading(false); }
  },[]);
  useEffect(() => { void load(); },[load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/appointments",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...form,timezone,starts_at:new Date(form.starts_at).toISOString(),ends_at:new Date(form.ends_at).toISOString()})});
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not save appointment");
      setAppointments((current)=>[...current,data.appointment].sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)));
      setShowForm(false);
      setForm({...form,title:"",notes:"",lead_id:""});
    } catch(e) { setError(e instanceof Error?e.message:"Could not save appointment"); }
    finally { setSaving(false); }
  }

  function beginEdit(item:Appointment) {
    setEditingId(item.id);
    setEditForm({
      title:item.title,lead_id:item.lead_id ?? "",
      starts_at:localInputDate(new Date(item.starts_at)),
      ends_at:localInputDate(new Date(item.ends_at)),
      // Datetime-local inputs use the browser timezone; save that IANA zone with the edited times.
      timezone,status:item.status,notes:item.notes ?? "",
    });
    setError("");
  }

  async function saveEdit(event:React.FormEvent<HTMLFormElement>,item:Appointment) {
    event.preventDefault();setSaving(true);setError("");
    try {
      const response=await fetch(`/api/appointments/${item.id}`,{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({
          ...editForm,lead_id:editForm.lead_id || null,
          starts_at:new Date(editForm.starts_at).toISOString(),
          ends_at:new Date(editForm.ends_at).toISOString(),
        }),
      });
      const data=await response.json();
      if(!response.ok) throw new Error(data?.error?.message || "Could not update appointment");
      setAppointments((current)=>current.map((x)=>x.id===item.id?data.appointment:x).sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)));
      setEditingId(null);
    } catch(e) { setError(e instanceof Error?e.message:"Could not update appointment"); }
    finally { setSaving(false); }
  }

  async function updateStatus(item:Appointment,status:Appointment["status"]) {
    setError("");
    try {
      const response=await fetch(`/api/appointments/${item.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status})});
      const data=await response.json();
      if(!response.ok) throw new Error(data?.error?.message || "Could not update appointment");
      setAppointments((current)=>current.map((x)=>x.id===item.id?data.appointment:x));
    } catch(e) { setError(e instanceof Error?e.message:"Could not update appointment"); }
  }
  async function remove(item:Appointment) {
    if(!window.confirm(`Delete appointment “${item.title}”?`)) return;
    try {
      const response=await fetch(`/api/appointments/${item.id}`,{method:"DELETE"});
      const data=await response.json();
      if(!response.ok) throw new Error(data?.error?.message || "Could not delete appointment");
      setAppointments((current)=>current.filter((x)=>x.id!==item.id));
      if(editingId===item.id) setEditingId(null);
    } catch(e) { setError(e instanceof Error?e.message:"Could not delete appointment"); }
  }

  const upcoming=appointments.filter((a)=>a.status==="scheduled" && Date.parse(a.starts_at)>=Date.now());
  const sorted=[...appointments].sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at));
  return <section className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-muted-foreground">Customer workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Appointments</h1><p className="mt-2 text-sm text-muted-foreground">Keep meetings and follow-ups in one place.</p></div><button onClick={()=>{setShowForm(!showForm);setEditingId(null);}} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">{showForm?<X size={16}/>:<Plus size={16}/>} {showForm?"Close":"Schedule appointment"}</button></header>
    {error&&<div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">{error}</div>}
    {showForm&&<form onSubmit={create} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
      <label className="space-y-1 text-sm sm:col-span-2">Title *<input required maxLength={180} value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className={inputClass}/></label>
      <label className="space-y-1 text-sm">Lead (optional)<select value={form.lead_id} onChange={(e)=>setForm({...form,lead_id:e.target.value})} className={inputClass}><option value="">No linked lead</option>{leads.map((l)=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
      <label className="space-y-1 text-sm">Timezone<input readOnly value={timezone} className="w-full rounded-md border bg-muted px-3 py-2 text-muted-foreground"/></label>
      <label className="space-y-1 text-sm">Starts *<input type="datetime-local" required value={form.starts_at} onChange={(e)=>setForm({...form,starts_at:e.target.value})} className={inputClass}/></label>
      <label className="space-y-1 text-sm">Ends *<input type="datetime-local" required value={form.ends_at} onChange={(e)=>setForm({...form,ends_at:e.target.value})} className={inputClass}/></label>
      <label className="space-y-1 text-sm sm:col-span-2">Notes<textarea rows={2} maxLength={5000} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} className={inputClass}/></label>
      <div className="sm:col-span-2"><button disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">{saving?"Saving…":"Save appointment"}</button></div>
    </form>}
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">All appointments</p><p className="mt-2 text-2xl font-semibold">{appointments.length}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Upcoming</p><p className="mt-2 text-2xl font-semibold">{upcoming.length}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Completed</p><p className="mt-2 text-2xl font-semibold">{appointments.filter((a)=>a.status==="completed").length}</p></div></div>
    <div className="overflow-hidden rounded-xl border bg-card">{loading?<p className="p-6 text-sm text-muted-foreground">Loading appointments…</p>:sorted.length===0?<div className="flex flex-col items-center gap-2 p-10 text-center"><CalendarClock className="text-muted-foreground" size={28}/><p className="font-medium">Nothing scheduled yet</p><p className="text-sm text-muted-foreground">Create an appointment to track your next follow-up.</p></div>:<div className="divide-y">{sorted.map((item)=>editingId===item.id?(
      <form key={item.id} onSubmit={(event)=>void saveEdit(event,item)} className="grid gap-3 p-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm sm:col-span-2">Title *<input required maxLength={180} value={editForm.title} onChange={(e)=>setEditForm({...editForm,title:e.target.value})} className={inputClass}/></label>
        <label className="space-y-1 text-sm">Lead (optional)<select value={editForm.lead_id} onChange={(e)=>setEditForm({...editForm,lead_id:e.target.value})} className={inputClass}><option value="">No linked lead</option>{leads.map((l)=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        <label className="space-y-1 text-sm">Saved timezone<input readOnly value={editForm.timezone} className="w-full rounded-md border bg-muted px-3 py-2 text-muted-foreground"/></label>
        <label className="space-y-1 text-sm">Starts *<input type="datetime-local" required value={editForm.starts_at} onChange={(e)=>setEditForm({...editForm,starts_at:e.target.value})} className={inputClass}/></label>
        <label className="space-y-1 text-sm">Ends *<input type="datetime-local" required value={editForm.ends_at} onChange={(e)=>setEditForm({...editForm,ends_at:e.target.value})} className={inputClass}/></label>
        <label className="space-y-1 text-sm">Status<select value={editForm.status} onChange={(e)=>setEditForm({...editForm,status:e.target.value as Appointment["status"]})} className={inputClass}>{statuses.map((status)=><option key={status} value={status}>{status[0].toUpperCase()+status.slice(1)}</option>)}</select></label>
        <label className="space-y-1 text-sm sm:col-span-2">Notes<textarea rows={2} maxLength={5000} value={editForm.notes} onChange={(e)=>setEditForm({...editForm,notes:e.target.value})} className={inputClass}/></label>
        <div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"><Save size={15}/>{saving?"Saving…":"Save changes"}</button><button type="button" onClick={()=>setEditingId(null)} className="rounded-lg border px-3 py-2 text-sm">Cancel</button></div>
      </form>
    ):<article key={item.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_150px_140px] md:items-center"><div><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{fmt(item.starts_at,item.timezone)} – {new Intl.DateTimeFormat(undefined,{timeZone:item.timezone,hour:"numeric",minute:"2-digit"}).format(new Date(item.ends_at))}</p><p className="mt-1 text-xs text-muted-foreground">{item.leads?.name ? `Lead: ${item.leads.name} · ` : ""}${item.timezone}</p>{item.notes&&<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.notes}</p>}</div><select aria-label={`Status for ${item.title}`} value={item.status} onChange={(e)=>void updateStatus(item,e.target.value as Appointment["status"])} className="rounded-md border bg-background px-2 py-2 text-sm"><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><div className="flex items-center gap-3 md:justify-end"><button onClick={()=>beginEdit(item)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><Pencil size={14}/> Edit</button><button onClick={()=>void remove(item)} className="text-sm text-muted-foreground hover:text-destructive">Delete</button></div></article>)}</div>}</div>
  </section>;
}
