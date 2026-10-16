import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarCheck2,
  CheckCircle2,
  Gauge,
  Globe2,
  ShieldCheck,
  Sparkles,
  Users,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "A fleet you can actually manage",
    description:
      "Keep each agent attached to the right workspace, with lifecycle controls and a dedicated workspace for its available tools.",
  },
  {
    icon: Webhook,
    title: "Every enquiry has a place",
    description:
      "Bring website leads into one pipeline. Durable intake and idempotency foundations help prevent lost or duplicated submissions.",
  },
  {
    icon: CalendarCheck2,
    title: "A clearer path to booking",
    description:
      "Connect lead context to your appointment workflow so the team can see what needs attention and what is already scheduled.",
  },
  {
    icon: Gauge,
    title: "Visibility into usage",
    description:
      "Review available usage and token information by agent and month. Set real server-side limits before enabling paid automation.",
  },
  {
    icon: Users,
    title: "Workspaces built for teams",
    description:
      "Separate customer workspaces and gate team actions by role rather than relying on hidden UI controls.",
  },
  {
    icon: ShieldCheck,
    title: "Server-side integrations",
    description:
      "Keep provider credentials on the server and validate access before reading or changing workspace data.",
  },
];

const steps = [
  ["01", "Connect your workspace", "Set up your account, team, and the services your deployment is configured to use."],
  ["02", "Choose the work", "Bring in a lead, manage an appointment, or open an agent workspace."],
  ["03", "Review what happened", "Follow task state, errors, and usage so automation stays observable."],
];

function BrandMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
      <Sparkles aria-hidden="true" className="h-5 w-5" />
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Bot;
  title: string;
  description: string;
}) {
  return (
    <article className="group rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/5">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f9ff] text-slate-950">
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[640px] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.14),_transparent_56%)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="MiniStaff AI home">
          <BrandMark />
          <span className="text-lg font-bold tracking-tight">MiniStaff <span className="text-indigo-600">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex" aria-label="Main navigation">
          <a href="#platform" className="transition hover:text-slate-950">Platform</a>
          <a href="#how-it-works" className="transition hover:text-slate-950">How it works</a>
          <a href="#safety" className="transition hover:text-slate-950">Security</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950 sm:px-4">Sign in</Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-indigo-700 sm:px-4">
            Get started <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-24">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-indigo-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            ONE WORKSPACE FOR YOUR AI OPERATIONS
          </div>
          <h1 className="mt-7 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl md:text-6xl">
            AI teammates for the work that <span className="bg-gradient-to-r from-indigo-700 via-violet-600 to-cyan-600 bg-clip-text text-transparent">moves business forward.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Manage your agent fleet, collect leads, keep appointments moving, and understand usage — without losing the details between tools.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-600/20 transition hover:bg-indigo-700">
              Create your workspace <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <a href="#platform" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white">
              Explore the platform
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Workspace-aware access</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Server-side credentials</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Observable workflows</span>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-xl lg:max-w-none">
          <div aria-hidden="true" className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-indigo-200/70 via-violet-100/70 to-cyan-100/80 blur-2xl" />
          <div className="relative rounded-[2rem] border border-white bg-white/90 p-4 shadow-2xl shadow-indigo-950/10 backdrop-blur sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Activity className="h-4 w-4" /></span> Operations overview</div>
                <p className="mt-2 text-xs text-slate-500">Illustrative preview · sample activity</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">Preview</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3.5 sm:p-4"><p className="text-[11px] font-medium text-slate-500">New leads</p><p className="mt-2 text-2xl font-semibold tracking-tight">12</p><p className="mt-1 text-[11px] text-slate-500">Sample count</p></div>
              <div className="rounded-2xl bg-indigo-50/70 p-3.5 sm:p-4"><p className="text-[11px] font-medium text-indigo-700">Agents</p><p className="mt-2 text-2xl font-semibold tracking-tight text-indigo-950">04</p><p className="mt-1 text-[11px] text-indigo-700/70">Sample count</p></div>
              <div className="rounded-2xl bg-cyan-50 p-3.5 sm:p-4"><p className="text-[11px] font-medium text-cyan-800">Bookings</p><p className="mt-2 text-2xl font-semibold tracking-tight text-cyan-950">06</p><p className="mt-1 text-[11px] text-cyan-800/70">Sample count</p></div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Latest activity</h2><span className="text-[11px] text-slate-400">DEMO DATA</span></div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Globe2 className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Website lead received</p><p className="mt-0.5 text-xs text-slate-500">Captured in the sales desk</p></div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Received</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-800"><CalendarCheck2 className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Appointment needs review</p><p className="mt-0.5 text-xs text-slate-500">A person stays in the loop</p></div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">Review</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-800"><Zap className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">Agent workspace updated</p><p className="mt-0.5 text-xs text-slate-500">Sample event</p></div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">Logged</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Workflow className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Keep every step visible</p><p className="mt-1 text-xs leading-5 text-slate-300">From intake to action, status and failures should be easy to find.</p></div>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="relative z-10 border-y border-slate-200/80 bg-white/75 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.18em] text-indigo-700">THE PLATFORM</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">The operational layer around your AI.</h2>
            <p className="mt-4 leading-7 text-slate-600">One place for the work around an agent: people, pipelines, appointments, permissions, and the cost of running it.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-indigo-700">HOW IT WORKS</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Designed for work you can follow.</h2>
              <p className="mt-4 leading-7 text-slate-600">A useful automation system does more than run. It shows what happened, what is waiting, and where a person needs to step in.</p>
              <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 transition hover:text-indigo-900">Open MiniStaff AI <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map(([number, title, description]) => (
                <article key={number} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="text-sm font-bold tracking-widest text-indigo-600">{number}</span>
                  <h3 className="mt-5 text-base font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="relative z-10 border-y border-slate-200 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.18em] text-cyan-300">BUILT WITH GUARDRAILS IN MIND</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Useful automation should stay observable.</h2>
            <p className="mt-4 leading-7 text-slate-300">MiniStaff is being built around workspace boundaries, server-side credentials, durable intake, and visible status. Each deployment still needs its own security, provider, email, and quota checks before launch.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">Get started <ArrowRight className="h-4 w-4" /></Link>
            <a href="#platform" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Review features</a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link href="/" className="flex items-center gap-3" aria-label="MiniStaff AI home"><BrandMark /><span className="text-sm font-bold">MiniStaff AI</span></Link>
          <p className="text-xs leading-5 text-slate-500">AI operations for customer-focused teams. Verify your deployment settings before connecting live customer data.</p>
          <div className="flex gap-5 text-sm font-medium text-slate-600"><Link href="/login" className="hover:text-indigo-700">Sign in</Link><Link href="/login" className="hover:text-indigo-700">Create account</Link></div>
        </div>
      </footer>
    </main>
  );
}
