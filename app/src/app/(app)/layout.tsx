import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShellClient } from "./AppShellClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShellClient user={user}>{children}</AppShellClient>;
}
