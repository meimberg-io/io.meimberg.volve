import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export async function getSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value");

  if (error) throw error;

  const settings: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) return null;
  return data?.value ?? null;
}

export async function updateSetting(
  key: string,
  value: string
): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw error;
}
