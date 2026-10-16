"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { safeNextPath } from "@/lib/site-url";

function callbackUrl(next: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}

export function AuthMethods() {
  const [phoneMode, setPhoneMode] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function oauth(provider: "google" | "github") {
    setBusy(true);
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl(next), skipBrowserRedirect: false },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
    }
  }

  async function sendEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) return toast.error("Could not send an email code. Check email Auth and SMTP settings.");
    setEmail(normalizedEmail);
    setEmailOtpSent(true);
    toast.success("If email OTP is configured, a verification code has been sent.");
  }

  async function verifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6,8}$/.test(emailOtp.trim())) {
      toast.error("Enter the verification code from your email.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: emailOtp.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) return toast.error("That email code is invalid or expired. Request a new one.");
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    window.location.href = next;
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    const normalizedPhone = phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
      toast.error("Enter a valid phone number in international format, e.g. +919876543210.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({ phone: normalizedPhone });
    setBusy(false);
    if (error) return toast.error(error.message);
    setOtpSent(true);
    toast.success("If SMS authentication is configured, a verification code has been sent.");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6,8}$/.test(otp.trim())) {
      toast.error("Enter the verification code from your SMS.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: "sms",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    window.location.href = next;
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" disabled={busy} onClick={() => void oauth("google")}>
          Continue with Google
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void oauth("github")}>
          Continue with GitHub
        </Button>
      </div>
      <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => { setEmailMode((v) => !v); setPhoneMode(false); }}>
        {emailMode ? "Hide email code sign-in" : "Continue with email code"}
      </Button>
      {emailMode && (
        <form className="space-y-3" onSubmit={emailOtpSent ? verifyEmailOtp : sendEmailOtp}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={emailOtpSent || busy}
            aria-label="Email address for one-time code"
          />
          {emailOtpSent && (
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Email verification code"
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value)}
              required
              minLength={6}
              maxLength={8}
              aria-label="Email verification code"
            />
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait..." : emailOtpSent ? "Verify email code and sign in" : "Send email code"}
          </Button>
          {emailOtpSent && (
            <button type="button" className="w-full text-center text-xs text-muted-foreground hover:text-foreground" disabled={busy} onClick={() => { setEmailOtpSent(false); setEmailOtp(""); }}>
              Use a different email or request another code
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            Requires Supabase email authentication and an email template configured to display the one-time code.
          </p>
        </form>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>OR PHONE</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      {!phoneMode ? (
        <Button type="button" variant="outline" className="w-full" onClick={() => { setPhoneMode(true); setEmailMode(false); }}>
          Continue with SMS verification
        </Button>
      ) : (
        <form className="space-y-3" onSubmit={otpSent ? verifyOtp : sendOtp}>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="+919876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={otpSent || busy}
            aria-label="Phone number in international format"
          />
          {otpSent && (
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="SMS verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              minLength={6}
              maxLength={8}
              aria-label="SMS verification code"
            />
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait..." : otpSent ? "Verify code and sign in" : "Send SMS code"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setPhoneMode(false); setOtpSent(false); setOtp(""); }}
          >
            Back to email sign-in
          </button>
          <p className="text-xs text-muted-foreground">
            SMS sign-in creates or signs into a phone-based account. It does not verify a phone number on an existing email account.
          </p>
        </form>
      )}
    </section>
  );
}
