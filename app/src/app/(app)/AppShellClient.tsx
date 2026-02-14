"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ReactNode } from "react";

interface AppShellClientProps {
  children: ReactNode;
  user: {
    email?: string | null;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
}

export function AppShellClient({ children, user }: AppShellClientProps) {
  return <AppShell user={user}>{children}</AppShell>;
}
