import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    field_instance_id,
    process_id,
    custom_prompt,
    additional_instructions,
    optimize,
    optimize_instruction,
  } = body;

  const supabase = await createClient();

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get field instance with template
  const { data: fieldInstance } = await supabase
    .from("field_instances")
    .select("*, template:field_templates(*)")
    .eq("id", field_instance_id)
    .single();

  if (!fieldInstance) {
    return new Response("Field not found", { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const template = fieldInstance.template as any;

  // Assemble context
  const contextParts: string[] = [];

  // 1. Get seed documents content
  const { data: seedDocs } = await supabase
    .from("seed_documents")
    .select("filename, storage_path")
    .eq("process_id", process_id)
    .order("order_index");

  if (seedDocs && seedDocs.length > 0) {
    // Get the consolidated seed content (first stage, first field)
    const { data: consolidatedField } = await supabase
      .from("field_instances")
      .select(`
        content,
        field_template_id,
        step_instance:step_instances(
          stage_instance:stage_instances(
            process_id,
            stage_template_id
          )
        )
      `)
      .eq("field_template_id", "30000000-0000-0000-0000-000000000001")
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (consolidatedField?.content && (consolidatedField as any).step_instance?.stage_instance?.process_id === process_id) {
      contextParts.push(`## Konsolidierter Seed\n${consolidatedField.content}`);
    } else {
      // Download actual seed document contents from storage
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
  }

  // 2. Get dependency contents
  const dependencies: string[] = template?.dependencies ?? [];
  if (dependencies.length > 0) {
    const { data: depFields } = await supabase
      .from("field_instances")
      .select(`
        content,
        field_template_id,
        template:field_templates(name),
        step_instance:step_instances(
          stage_instance:stage_instances(process_id)
        )
      `)
      .in("field_template_id", dependencies);

    if (depFields) {
      for (const df of depFields) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((df as any).step_instance?.stage_instance?.process_id === process_id && df.content) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const depName = (df.template as any)?.name ?? "Referenz";
          contextParts.push(`## ${depName}\n${df.content}`);
        }
      }
    }
  }

  // 3. Get completed fields from previous stages
  const { data: allStageFields } = await supabase
    .from("field_instances")
    .select(`
      content,
      status,
      template:field_templates(name),
      step_instance:step_instances(
        stage_instance:stage_instances(
          process_id,
          stage_template_id,
          template:stage_templates(name, order_index)
        )
      )
    `)
    .eq("status", "closed");

  if (allStageFields) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevStageFields = allStageFields.filter((f: any) => {
      const stageInstance = f.step_instance?.stage_instance;
      return stageInstance?.process_id === process_id && f.content;
    });

    if (prevStageFields.length > 0) {
      const summary = prevStageFields
        .slice(0, 10) // Limit context size
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((f: any) => `### ${f.template?.name}\n${f.content?.slice(0, 500)}`)
        .join("\n\n");
      contextParts.push(`## Bisherige Ergebnisse\n${summary}`);
    }
  }

  const context = contextParts.join("\n\n---\n\n");

  // Build prompt
  let systemPrompt = `Du bist ein erfahrener Business-Berater und Strategie-Assistent. Du hilfst bei der systematischen Entwicklung von Geschäftsideen. Antworte auf Deutsch. Nutze Markdown-Formatierung.`;

  let userPrompt: string;

  if (optimize && optimize_instruction) {
    systemPrompt += `\n\nDer Nutzer möchte einen bestehenden Inhalt optimieren. Behalte die Grundstruktur bei, verbessere aber gemäß der Anweisung.`;
    userPrompt = `## Aktueller Inhalt\n${fieldInstance.content}\n\n## Optimierungsanweisung\n${optimize_instruction}`;

    if (context) {
      userPrompt += `\n\n## Kontext\n${context}`;
    }
  } else {
    const basePrompt = custom_prompt ?? template?.ai_prompt ?? "Generiere passenden Inhalt für dieses Feld.";
    userPrompt = basePrompt;

    if (additional_instructions) {
      userPrompt += `\n\n## Zusatzanweisungen\n${additional_instructions}`;
    }

    if (context) {
      userPrompt += `\n\n## Kontext\n${context}`;
    }
  }

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 2000,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI generation error:", error);
    return new Response("AI generation failed", { status: 500 });
  }
}
