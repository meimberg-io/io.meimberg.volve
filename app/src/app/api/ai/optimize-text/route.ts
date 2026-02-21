import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/model";

export async function POST(request: Request) {
  const body = await request.json();
  const { text } = body as { text: string };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (typeof text !== "string") {
    return new Response("Missing or invalid text", { status: 400 });
  }

  const model = await getModel();
  const { data: settingsRows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["ai_system_execution", "ai_meta_prompt"]);
  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) {
    settings[row.key] = row.value;
  }
  const systemPrompt =
    settings["ai_system_execution"] ??
    "Du bist ein hilfreicher Assistent. Antworte auf Deutsch.";
  const metaPrompt = settings["ai_meta_prompt"] ?? "";
  const system = metaPrompt ? `${systemPrompt}\n\n${metaPrompt}` : systemPrompt;

  try {
    const result = await generateText({
      model,
      system: `${system}\n\nDer Nutzer gibt einen Rohtext ein. Deine Aufgabe: Den Text sauber abrunden, in gutem Deutsch formulieren und inhaltlich unverändert zurückgeben. Keine Zusätze, keine Nummerierungen, nur den bereinigten Fließtext.`,
      prompt: text.trim() || "(Leer)",
      maxOutputTokens: 4000,
    });
    return Response.json({ text: result.text });
  } catch (error) {
    console.error("Optimize text error:", error);
    return new Response("Optimization failed", { status: 500 });
  }
}
