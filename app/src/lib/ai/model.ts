import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createClient } from "@/lib/supabase/server";

export const AI_MODELS = [
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" as const },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" as const },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openai" as const },
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai" as const },
  { id: "gpt-5.2", label: "GPT-5.2", provider: "openai" as const },
  { id: "claude-3.5-sonnet-20241022", label: "Claude 3.5 Sonnet", provider: "anthropic" as const },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "anthropic" as const },
  { id: "claude-opus-4-20250514", label: "Claude Opus 4", provider: "anthropic" as const },
  { id: "claude-opus-4-5-20251101", label: "Claude Opus 4.5", provider: "anthropic" as const },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "anthropic" as const },
] as const;

export type AIModelId = (typeof AI_MODELS)[number]["id"];

const DEFAULT_MODEL: AIModelId = "gpt-5.2";

function resolveModel(
  modelId: string,
  customKeys?: { openai?: string; anthropic?: string }
) {
  const entry = AI_MODELS.find((m) => m.id === modelId);
  if (!entry) {
    return customKeys?.openai
      ? createOpenAI({ apiKey: customKeys.openai })(DEFAULT_MODEL)
      : openai(DEFAULT_MODEL);
  }

  if (entry.provider === "anthropic") {
    return customKeys?.anthropic
      ? createAnthropic({ apiKey: customKeys.anthropic })(entry.id)
      : anthropic(entry.id);
  }

  return customKeys?.openai
    ? createOpenAI({ apiKey: customKeys.openai })(entry.id)
    : openai(entry.id);
}

export async function getModel() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["ai_model", "openai_api_key", "anthropic_api_key"]);

  const settings: Record<string, string> = {};
  for (const row of rows ?? []) {
    settings[row.key] = row.value;
  }

  const customKeys = {
    openai: settings["openai_api_key"] || undefined,
    anthropic: settings["anthropic_api_key"] || undefined,
  };

  return resolveModel(settings["ai_model"] ?? DEFAULT_MODEL, customKeys);
}
