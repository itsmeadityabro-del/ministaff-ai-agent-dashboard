"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu() {
  const { current, userEmail } = useWorkspace();
  const initial = (userEmail.trim()[0] ?? "?").toUpperCase();

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-2 px-2 py-2 font-normal">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-medium text-secondary-foreground">
            {initial}
          </span>
          <span className="flex min-w-0 flex-col text-left">
            <span className="truncate text-sm">{userEmail}</span>
            <span className="truncate text-xs text-muted-foreground">{current?.name ?? "MiniStaff workspace"}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start" side="top">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm">{userEmail}</span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">{current?.name ?? "MiniStaff workspace"}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
