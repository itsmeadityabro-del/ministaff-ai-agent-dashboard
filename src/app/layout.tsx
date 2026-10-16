import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { branding } from "@/config/branding";

const description =
  "Manage AI agents, leads, appointments, team workspaces, and usage from one MiniStaff AI operations hub.";

export const metadata: Metadata = {
  title: {
    default: branding.appName,
    template: "%s | " + branding.appName,
  },
  description,
  applicationName: branding.appName,
  openGraph: {
    type: "website",
    siteName: branding.appName,
    title: branding.appName,
    description,
  },
  twitter: {
    card: "summary",
    title: branding.appName,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
