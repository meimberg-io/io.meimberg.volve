import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/model";

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

  let systemPrompt = `Du bist ein erfahrener Business-Berater und Strategie-Assistent. Du hilfst bei der systematischen Entwicklung von Geschäftsideen. Antworte auf Deutsch. Nutze Markdown-Formatierung.`;

  let userPrompt: string;

  if (optimize && optimize_instruction) {
    systemPrompt += `\n\nDer Nutzer möchte einen bestehenden Inhalt optimieren. Behalte die Grundstruktur bei, verbessere aber gemäß der Anweisung.`;
    userPrompt = `## Aktueller Inhalt\n${field.content}\n\n## Optimierungsanweisung\n${optimize_instruction}`;

    if (context) {
      userPrompt += `\n\n## Kontext\n${context}`;
    }
  } else {
    const basePrompt = custom_prompt ?? field.ai_prompt ?? "Generiere passenden Inhalt für dieses Feld.";
    userPrompt = basePrompt;

    if (additional_instructions) {
      userPrompt += `\n\n## Zusatzanweisungen\n${additional_instructions}`;
    }

    if (context) {
      userPrompt += `\n\n## Kontext\n${context}`;
    }
  }

  try {
    const model = await getModel();
    const result = streamText({
      model,
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
