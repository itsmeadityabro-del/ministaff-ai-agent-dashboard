import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9ff] px-6 text-slate-950">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-indigo-950/5 sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 text-white">
          <Sparkles aria-hidden="true" className="h-7 w-7" />
        </span>
        <p className="mt-7 text-sm font-bold tracking-[0.2em] text-indigo-700">404 · PAGE NOT FOUND</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">This page isn’t here.</h1>
        <p className="mt-3 leading-7 text-slate-600">
          The link may be out of date, or the page may have moved.
        </p>
        <Link href="/" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to MiniStaff
        </Link>
      </div>
    </main>
  );
}
