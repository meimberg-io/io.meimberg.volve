import { streamText, generateObject } from "ai";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/model";
import { z } from "zod";

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
          type: z.enum(["text", "long_text", "file", "file_list", "task", "task_list"]),
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

function fillPromptTemplate(
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

  async function getPromptTemplate(key: string): Promise<string> {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .single();
    return data?.value ?? "";
  }

  const model = await getModel();

  // Load modelling system prompt + global meta prompt
  const { data: settingsRows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["ai_system_modelling", "ai_meta_prompt"]);

  const settingsMap: Record<string, string> = {};
  for (const row of settingsRows ?? []) {
    settingsMap[row.key] = row.value;
  }

  const modellingPrompt = settingsMap["ai_system_modelling"]
    ?? "Du bist ein erfahrener Business-Berater und Prozess-Designer. Du hilfst bei der systematischen Strukturierung von Geschäftsprozessen. Antworte auf Deutsch.";
  const metaPrompt = settingsMap["ai_meta_prompt"] ?? "";
  const SYSTEM_BASE = metaPrompt
    ? `${modellingPrompt}\n\n${metaPrompt}`
    : modellingPrompt;

  try {
    if (mode === "process_description") {
      const prompt = userPrompt ?? "Beschreibe diesen Prozess.";
      const result = streamText({
        model,
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
        model,
        system: `${SYSTEM_BASE}\n\nDer Nutzer hat eine bestehende Prozessbeschreibung, die er optimieren oder ergänzen möchte. Behalte die bestehende Struktur und den Inhalt bei, aber passe sie gemäß der Anweisung an. Gib die vollständige, überarbeitete Beschreibung zurück. Nutze Markdown-Formatierung.`,
        prompt: `## Aktuelle Beschreibung\n${currentDesc}\n\n## Änderungsanweisung\n${instruction}`,
        maxOutputTokens: 2000,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "describe_stage") {
      const template = await getPromptTemplate("tpl_describe_stage");
      const prompt = fillPromptTemplate(template, context);
      const result = streamText({
        model,
        system: SYSTEM_BASE,
        prompt: userPrompt ? `${prompt}\n\nZusatzhinweis: ${userPrompt}` : prompt,
        maxOutputTokens: 500,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "describe_step") {
      const template = await getPromptTemplate("tpl_describe_step");
      const prompt = fillPromptTemplate(template, context);
      const result = streamText({
        model,
        system: SYSTEM_BASE,
        prompt: userPrompt ? `${prompt}\n\nZusatzhinweis: ${userPrompt}` : prompt,
        maxOutputTokens: 500,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "generate_stages") {
      const template = await getPromptTemplate("tpl_generate_stages");
      const prompt = fillPromptTemplate(template, context);
      const result = await generateObject({
        model,
        system: SYSTEM_BASE,
        prompt: userPrompt ? `${prompt}\n\nZusatzhinweis: ${userPrompt}` : prompt,
        schema: stagesSchema,
      });
      return Response.json(result.object);
    }

    if (mode === "extend_stages") {
      const template = await getPromptTemplate("tpl_extend_stages");
      const extendContext = { ...context, user_prompt: userPrompt || "" };
      const prompt = fillPromptTemplate(template, extendContext);
      const result = await generateObject({
        model,
        system: SYSTEM_BASE,
        prompt,
        schema: stagesSchema,
      });
      return Response.json(result.object);
    }

    if (mode === "generate_steps") {
      const template = await getPromptTemplate("tpl_generate_steps");
      const prompt = fillPromptTemplate(template, context);
      const result = await generateObject({
        model,
        system: SYSTEM_BASE,
        prompt: userPrompt ? `${prompt}\n\nZusatzhinweis: ${userPrompt}` : prompt,
        schema: stepsSchema,
      });
      return Response.json(result.object);
    }

    if (mode === "extend_steps") {
      const template = await getPromptTemplate("tpl_extend_steps");
      const extendContext = { ...context, user_prompt: userPrompt || "" };
      const prompt = fillPromptTemplate(template, extendContext);
      const result = await generateObject({
        model,
        system: SYSTEM_BASE,
        prompt,
        schema: stepsSchema,
      });
      return Response.json(result.object);
    }

    if (mode === "suggest_icon") {
      const iconSchema = z.object({
        icon: z.string().describe("Lucide icon name in kebab-case, e.g. 'sparkles', 'file-text', 'rocket'"),
      });
      const result = await generateObject({
        model,
        system: `${SYSTEM_BASE}\n\nDu wählst ein passendes Lucide-React Icon (lucide.dev) für eine Stage eines Geschäftsprozesses aus. Verwende den kebab-case Icon-Namen (z.B. "sparkles", "lightbulb", "target", "search", "bar-chart", "file-text", "rocket", "shield-check", "users", "settings", "zap", "brain", "clipboard-list", "check-circle", "trending-up"). Wähle ein Icon das den Inhalt und Zweck der Stage visuell gut repräsentiert.`,
        prompt: `Stage: "${context.stage_name}"\nBeschreibung: ${context.stage_description || "(keine)"}`,
        schema: iconSchema,
      });
      return Response.json(result.object);
    }

    if (mode === "generate_field_prompt") {
      const result = streamText({
        model,
        system: `${SYSTEM_BASE}\n\nDu erstellst einen präzisen, konkreten Prompt (Anweisung) für eine KI, die später den Inhalt eines bestimmten Feldes in einem Geschäftsprozess generieren soll. Der Prompt soll klar beschreiben, WAS generiert werden soll und welche QUALITÄTSKRITERIEN gelten. WICHTIG: Nenne NICHT die Namen von Stages, Steps, Abschnitten oder Nummerierungen — der strukturelle Kontext (Prozess, Stage, Step, Feldname) wird zur Laufzeit automatisch hinzugefügt und kann sich durch Verschiebungen ändern. Schreibe den Prompt auf Deutsch, als direkte Anweisung an die KI. Verwende KEIN Markdown — nur Fließtext.`,
        prompt: `Erstelle einen KI-Prompt für folgendes Feld:\n\nProzess: ${context.process_description || "(keine Beschreibung)"}\nStage: ${context.stage_name}${context.stage_description ? ` — ${context.stage_description}` : ""}\nStep: ${context.step_name}${context.step_description ? ` — ${context.step_description}` : ""}\nField: ${context.field_name}${context.field_description ? ` — ${context.field_description}` : ""}${userPrompt ? `\n\nZusatzhinweis: ${userPrompt}` : ""}`,
        maxOutputTokens: 500,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "optimize_field_prompt") {
      const currentPrompt = context.current_description ?? "";
      const instruction = userPrompt ?? "Optimiere den Prompt.";
      const result = streamText({
        model,
        system: `${SYSTEM_BASE}\n\nDer Nutzer hat einen bestehenden KI-Prompt für ein Feld in einem Geschäftsprozess und möchte ihn verbessern. Behalte die grundlegende Intention bei, aber passe den Prompt gemäß der Anweisung an. Gib den vollständigen, überarbeiteten Prompt zurück. Verwende KEIN Markdown — nur Fließtext.`,
        prompt: `## Aktueller Prompt\n${currentPrompt}\n\n## Kontext\nProzess: ${context.process_description || "(keine Beschreibung)"}\nStage: ${context.stage_name || "(unbekannt)"}\nStep: ${context.step_name || "(unbekannt)"}\nField: ${context.field_name || "(unbekannt)"}${context.field_description ? ` — ${context.field_description}` : ""}\n\n## Änderungsanweisung\n${instruction}`,
        maxOutputTokens: 500,
      });
      return result.toTextStreamResponse();
    }

    if (mode === "generate_dependencies") {
      const template = await getPromptTemplate("tpl_generate_dependencies");
      const prompt = fillPromptTemplate(template, context);
      const result = await generateObject({
        model,
        system: `${SYSTEM_BASE}\n\nDu analysierst die Struktur eines Prozessmodells und bestimmst logische Abhängigkeiten zwischen Fields. Die Fields sind in Prozessreihenfolge nummeriert (Stage > Step > Field). Verwende AUSSCHLIESSLICH die angegebenen Field-IDs. Erzeuge Dependencies für JEDES Field, das sinnvolle Vorgänger hat. Sortiere depends_on so, dass das späteste (konkreteste) Field zuerst steht. Im Zweifel lieber eine Dependency zu viel als zu wenig.`,
        prompt,
        schema: dependenciesSchema,
      });
      return Response.json(result.object);
    }

    if (mode === "generate_header_image") {
      const modelId = context.model_id;
      if (!modelId) {
        return new Response("model_id required", { status: 400 });
      }

      const template = await getPromptTemplate("tpl_header_image");
      const promptText = userPrompt?.trim() ?? "";
      const modelName = context.model_name ?? "";
      const userInstruction = promptText
        ? `\n\nWICHTIG – Zusätzliche Anweisung des Nutzers (hat höchste Priorität):\n${promptText}`
        : "";
      const imagePrompt = template
        ? fillPromptTemplate(template, {
            process_description: context.process_description ?? "",
            model_name: modelName,
            user_prompt: userInstruction,
          })
        : `Erstelle ein abstraktes, modernes Header-Bild für den Geschäftsprozess "${modelName}". Kontext: ${context.process_description ?? ""}${userInstruction}. Stil: dunkel, professionell, technisch, abstrakt. Keine Texte, keine Logos.`;

      console.log("DALL-E prompt:", imagePrompt);

      const openaiClient = new OpenAI();
      const imageResponse = await openaiClient.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        size: "1792x1024",
        quality: "standard",
        n: 1,
      });

      const imageUrl = imageResponse.data?.[0]?.url;
      if (!imageUrl) {
        return new Response("Image generation failed", { status: 500 });
      }

      const imgFetch = await fetch(imageUrl);
      const imgBuffer = await imgFetch.arrayBuffer();

      const timestamp = Date.now();
      const storagePath = `${modelId}_${timestamp}.png`;
      const { error: uploadError } = await supabase.storage
        .from("header-images")
        .upload(storagePath, imgBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return new Response("Image upload failed", { status: 500 });
      }

      const headerImageValue = `header-images/${storagePath}`;

      return Response.json({ header_image: headerImageValue });
    }

    return new Response(`Unknown mode: ${mode}`, { status: 400 });
  } catch (error) {
    console.error("Process generation error:", error);
    return new Response("AI generation failed", { status: 500 });
  }
}
