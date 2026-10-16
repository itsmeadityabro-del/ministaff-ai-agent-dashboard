import { branding } from "@/config/branding";

export default function InvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{branding.appName}</h1>
        <p className="text-sm text-muted-foreground">
          Team invitations are not enabled for MiniStaff accounts. Sign in using the verified email address associated with your purchase.
        </p>
      </div>
    </main>
  );
}
