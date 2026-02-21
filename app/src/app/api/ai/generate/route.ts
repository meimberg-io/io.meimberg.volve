import { streamText, generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/model";

const taskListSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      notes: z.string(),
      type: z.enum(["self", "delegated"]),
      status: z.enum(["not_started", "planned", "in_progress", "done", "wont_do"]),
    })
  ),
});

export async function POST(request: Request) {
  const body = await request.json();
  const {
    field_id,
    process_id,
    custom_prompt,
    additional_instructions,
    optimize,
    optimize_instruction,
  } = body;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: field } = await supabase
    .from("fields")
    .select("*")
    .eq("id", field_id)
    .single();

  if (!field) {
    return new Response("Field not found", { status: 404 });
  }

  // Resolve current structural context and system prompts (step → stage → process)
  const { data: step } = await supabase
    .from("steps")
    .select("name, stage_id")
    .eq("id", field.step_id)
    .single();

  let stageName = "";
  let stageSystemPrompt: string | null = null;
  let processName = "";
  let processDescription = "";
  let processSystemPrompt: string | null = null;

  if (step) {
    const { data: stage } = await supabase
      .from("stages")
      .select("name, process_id, ai_system_prompt")
      .eq("id", step.stage_id)
      .single();

    if (stage) {
      stageName = stage.name;
      stageSystemPrompt = stage.ai_system_prompt;
      const { data: process } = await supabase
        .from("processes")
        .select("name, description, ai_system_prompt")
        .eq("id", stage.process_id)
        .single();
      if (process) {
        processName = process.name;
        processDescription = process.description ?? "";
        processSystemPrompt = process.ai_system_prompt;
      }
    }
  }

  // Load global settings: execution system prompt + meta prompt
  const { data: settingsRows } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["ai_system_execution", "ai_meta_prompt"]);

  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) {
    settings[row.key] = row.value;
  }

  // Cascade: stage → process → global setting
  const executionPrompt =
    stageSystemPrompt
    ?? processSystemPrompt
    ?? settings["ai_system_execution"]
    ?? "Du bist ein hilfreicher Assistent. Antworte auf Deutsch. Nutze Markdown-Formatierung.";

  const metaPrompt = settings["ai_meta_prompt"] ?? "";

  const structuralContext = [
    processName && `Prozess: „${processName}"`,
    processDescription && `Prozessbeschreibung: ${processDescription}`,
    stageName && `Stage: „${stageName}"`,
    step?.name && `Step: „${step.name}"`,
    field.name && `Field: „${field.name}"`,
  ]
    .filter(Boolean)
    .join("\n");

  const contextParts: string[] = [];

  // 1. Seed documents content
  const { data: seedDocs } = await supabase
    .from("seed_documents")
    .select("filename, storage_path")
    .eq("process_id", process_id)
    .order("order_index");

  if (seedDocs && seedDocs.length > 0) {
    const seedContents: string[] = [];
    for (const doc of seedDocs) {
      try {
        const { data: fileData, error: dlError } = await supabase.storage
          .from("seeds")
          .download(doc.storage_path);
        if (!dlError && fileData) {
          const text = await fileData.text();
          seedContents.push(`### ${doc.filename}\n${text}`);
        } else {
          seedContents.push(`### ${doc.filename}\n(Inhalt konnte nicht geladen werden)`);
        }
      } catch {
        seedContents.push(`### ${doc.filename}\n(Fehler beim Laden)`);
      }
    }
    contextParts.push(`## Seed-Dokumente\n${seedContents.join("\n\n")}`);
  }

  // 2. Dependency contents
  const dependencies: string[] = field.dependencies ?? [];
  if (dependencies.length > 0) {
    const { data: depFields } = await supabase
      .from("fields")
      .select(`
        id,
        content,
        name,
        step:steps(
          stage:stages(process_id)
        )
      `)
      .in("id", dependencies);

    if (depFields) {
      for (const df of depFields) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((df as any).step?.stage?.process_id === process_id && df.content) {
          const depName = df.name ?? "Referenz";
          contextParts.push(`## ${depName}\n${df.content}`);
        }
      }
    }
  }

  // 3. Completed fields from previous stages
  const { data: allStageFields } = await supabase
    .from("fields")
    .select(`
      content,
      name,
      status,
      step:steps(
        stage:stages(process_id)
      )
    `)
    .eq("status", "closed");

  if (allStageFields) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevStageFields = allStageFields.filter((f: any) => {
      const stage = f.step?.stage;
      return stage?.process_id === process_id && f.content;
    });

    if (prevStageFields.length > 0) {
      const summary = prevStageFields
        .slice(0, 10)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((f: any) => `### ${f.name}\n${f.content?.slice(0, 500)}`)
        .join("\n\n");
      contextParts.push(`## Bisherige Ergebnisse\n${summary}`);
    }
  }

  const context = contextParts.join("\n\n---\n\n");

  let systemPrompt = executionPrompt;
  if (metaPrompt) {
    systemPrompt += `\n\n${metaPrompt}`;
  }

  let userPrompt: string;

  if (optimize && optimize_instruction && field.type !== "task_list") {
    systemPrompt += `\n\nDer Nutzer möchte einen bestehenden Inhalt optimieren. Behalte die Grundstruktur bei, verbessere aber gemäß der Anweisung.`;
    userPrompt = `## Aktueller Inhalt\n${field.content}\n\n## Optimierungsanweisung\n${optimize_instruction}`;

    if (structuralContext) {
      userPrompt += `\n\n## Struktureller Kontext\n${structuralContext}`;
    }

    if (context) {
      userPrompt += `\n\n## Kontext\n${context}`;
    }
  } else {
    const basePrompt = custom_prompt ?? field.ai_prompt ?? "Generiere passenden Inhalt für dieses Feld.";
    userPrompt = basePrompt;

    if (structuralContext) {
      userPrompt += `\n\n## Struktureller Kontext\n${structuralContext}`;
    }

    if (additional_instructions) {
      userPrompt += `\n\n## Zusatzanweisungen\n${additional_instructions}`;
    }

    if (context) {
      userPrompt += `\n\n## Kontext\n${context}`;
    }
  }

  try {
    const model = await getModel();

    if (field.type === "task_list") {
      const jsonInstruction =
        "Antworte ausschließlich mit gültigem JSON. Kein Markdown, kein Fließtext. Das JSON muss ein Objekt mit genau einem Array \"tasks\" sein. Jedes Element hat: title (string), notes (string), type (\"self\" oder \"delegated\"), status (\"not_started\", \"planned\", \"in_progress\", \"done\" oder \"wont_do\").";
      const result = await generateObject({
        model,
        system: `${systemPrompt}\n\n${jsonInstruction}`,
        prompt: userPrompt,
        schema: taskListSchema,
      });

      await supabase.from("task_list_items").delete().eq("field_id", field.id);
      const tasks = result.object.tasks ?? [];
      if (tasks.length > 0) {
        await supabase.from("task_list_items").insert(
          tasks.map((t, i) => ({
            field_id: field.id,
            order_index: i,
            title: t.title || "",
            notes: t.notes || "",
            type: t.type || "self",
            status: t.status || "not_started",
          }))
        );
      }
      await supabase
        .from("fields")
        .update({ status: "open" })
        .eq("id", field.id);

      return Response.json({ ok: true, count: tasks.length });
    }

    const result = streamText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 40000,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI generation error:", error);
    return new Response("AI generation failed", { status: 500 });
  }
}
