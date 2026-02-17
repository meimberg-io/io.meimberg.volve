import { streamText, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SYSTEM_BASE = `Du bist ein erfahrener Business-Berater und Prozess-Designer. Du hilfst bei der systematischen Strukturierung von Geschäftsprozessen. Antworte auf Deutsch.`;

const stagesSchema = z.object({
  stages: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
});

const stepsSchema = z.object({
  steps: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      fields: z.array(
        z.object({
          name: z.string(),
          type: z.enum(["text", "long_text", "file", "file_list", "task"]),
          description: z.string(),
          ai_prompt: z.string(),
        })
      ),
    })
  ),
});

const dependenciesSchema = z.object({
  dependencies: z.array(
    z.object({
      field_id: z.string(),
      depends_on: z.array(z.string()),
    })
  ),
});

function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value || "(nicht vorhanden)");
  }
  return result;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { mode, context, userPrompt } = body as {
    mode: string;
    context: Record<string, string>;
    userPrompt?: string;
  };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  async function getTemplate(key: string): Promise<string> {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .single();
    return data?.value ?? "";
  }

  try {
    if (mode === "process_description") {
      const prompt = userPrompt ?? "Beschreibe diesen Prozess.";
      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: `${SYSTEM_BASE}\n\nErstelle eine strukturierte Beschreibung für einen Geschäftsprozess basierend auf der Eingabe des Nutzers. Die Beschreibung soll klar und prägnant sein, die Ziele des Prozesses erklären und für wen er gedacht ist. Nutze Markdown-Formatierung.`,
        prompt,
        maxOutputTokens: 1000,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "optimize_description") {
      const currentDesc = context.current_description ?? "";
      const instruction = userPrompt ?? "Optimiere die Beschreibung.";
      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: `${SYSTEM_BASE}\n\nDer Nutzer hat eine bestehende Prozessbeschreibung, die er optimieren oder ergänzen möchte. Behalte die bestehende Struktur und den Inhalt bei, aber passe sie gemäß der Anweisung an. Gib die vollständige, überarbeitete Beschreibung zurück. Nutze Markdown-Formatierung.`,
        prompt: `## Aktuelle Beschreibung\n${currentDesc}\n\n## Änderungsanweisung\n${instruction}`,
        maxOutputTokens: 2000,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "describe_stage") {
      const template = await getTemplate("tpl_describe_stage");
      const prompt = fillTemplate(template, context);
      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_BASE,
        prompt: userPrompt ? `${prompt}\n\nZusatzhinweis: ${userPrompt}` : prompt,
        maxOutputTokens: 500,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "describe_step") {
      const template = await getTemplate("tpl_describe_step");
      const prompt = fillTemplate(template, context);
      const result = streamText({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_BASE,
        prompt: userPrompt ? `${prompt}\n\nZusatzhinweis: ${userPrompt}` : prompt,
        maxOutputTokens: 500,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "generate_stages") {
      const template = await getTemplate("tpl_generate_stages");
      const prompt = fillTemplate(template, context);
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_BASE,
        prompt: userPrompt ? `${prompt}\n\nZusatzhinweis: ${userPrompt}` : prompt,
        schema: stagesSchema,
      });
      return Response.json(result.object);
    }

    if (mode === "generate_steps") {
      const template = await getTemplate("tpl_generate_steps");
      const prompt = fillTemplate(template, context);
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        system: SYSTEM_BASE,
        prompt: userPrompt ? `${prompt}\n\nZusatzhinweis: ${userPrompt}` : prompt,
        schema: stepsSchema,
      });
      return Response.json(result.object);
    }

    if (mode === "generate_dependencies") {
      const template = await getTemplate("tpl_generate_dependencies");
      const prompt = fillTemplate(template, context);
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        system: `${SYSTEM_BASE}\n\nDu analysierst die Struktur eines Prozess-Templates und bestimmst logische Abhängigkeiten zwischen Fields. Verwende ausschließlich die angegebenen Field-IDs.`,
        prompt,
        schema: dependenciesSchema,
      });
      return Response.json(result.object);
    }

    return new Response(`Unknown mode: ${mode}`, { status: 400 });
  } catch (error) {
    console.error("Template generation error:", error);
    return new Response("AI generation failed", { status: 500 });
  }
}
