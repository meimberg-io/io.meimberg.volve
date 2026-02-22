import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getModel } from '@/lib/ai/model'

const RENDERABLE_TYPES = new Set(['text', 'long_text', 'task_list', 'task'])

const dossierFieldsSchema = z.object({
  field_ids: z.array(z.string()),
})

export async function POST(request: Request) {
  const { field_id, process_id } = await request.json()

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: dossierField } = await supabase
    .from('fields')
    .select('description, name')
    .eq('id', field_id)
    .single()

  if (!dossierField) return new Response('Field not found', { status: 404 })

  const description = dossierField.description?.trim()
  if (!description) {
    return Response.json(
      { error: 'Beschreibung ist erforderlich' },
      { status: 400 }
    )
  }

  const { data: process } = await supabase
    .from('processes')
    .select('name, description')
    .eq('id', process_id)
    .single()

  const { data: stages } = await supabase
    .from('stages')
    .select('id, name, order_index')
    .eq('process_id', process_id)
    .order('order_index')

  const stageIds = (stages ?? []).map((s) => s.id)
  if (!stageIds.length) return Response.json({ field_ids: [] })

  const { data: steps } = await supabase
    .from('steps')
    .select('id, name, stage_id, order_index')
    .in('stage_id', stageIds)
    .order('order_index')

  const stepIds = (steps ?? []).map((s) => s.id)
  if (!stepIds.length) return Response.json({ field_ids: [] })

  const { data: allFields } = await supabase
    .from('fields')
    .select('id, name, type, description, step_id, order_index')
    .in('step_id', stepIds)
    .order('order_index')

  const stageMap = Object.fromEntries((stages ?? []).map((s) => [s.id, s]))
  const stepMap = Object.fromEntries((steps ?? []).map((s) => [s.id, s]))

  const candidateFields = (allFields ?? [])
    .filter((f) => f.id !== field_id && RENDERABLE_TYPES.has(f.type))

  if (!candidateFields.length) return Response.json({ field_ids: [] })

  const fieldTable = candidateFields
    .map((f) => {
      const step = stepMap[f.step_id]
      const stage = step ? stageMap[step.stage_id] : null
      return `- ID: ${f.id} | Name: "${f.name}" | Typ: ${f.type} | Stage: "${stage?.name ?? '?'}" | Step: "${step?.name ?? '?'}" | Beschreibung: "${f.description ?? ''}" `
    })
    .join('\n')

  const { data: settingsRows } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['ai_system_execution', 'ai_meta_prompt'])

  const settings: Record<string, string> = {}
  for (const row of settingsRows ?? []) settings[row.key] = row.value

  const systemPrompt = [
    settings['ai_system_execution'] ?? 'Du bist ein hilfreicher Assistent. Antworte auf Deutsch.',
    settings['ai_meta_prompt'],
    'Du wählst Felder aus einem Prozess aus, die für ein bestimmtes Export-Dokument relevant sind.',
    'Antworte ausschließlich mit gültigem JSON. Das JSON muss ein Objekt mit genau einem Array "field_ids" sein, das die IDs der ausgewählten Felder enthält.',
    'Wähle nur Felder aus der gegebenen Liste. Behalte die Reihenfolge bei, in der die Felder im Dokument erscheinen sollen.',
  ].filter(Boolean).join('\n\n')

  const userPrompt = [
    `## Prozess: "${process?.name ?? ''}"`,
    process?.description ? `Prozessbeschreibung: ${process.description}` : null,
    `## Dossier-Feld: "${dossierField.name}"`,
    `## Gewünschtes Dokument\n${description}`,
    `## Verfügbare Felder\n${fieldTable}`,
    'Wähle die Felder aus, die für das gewünschte Dokument relevant sind, und gib ihre IDs zurück.',
  ].filter(Boolean).join('\n\n')

  try {
    const model = await getModel()
    const result = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: dossierFieldsSchema,
    })

    const validIds = new Set(candidateFields.map((f) => f.id))
    const fieldIds = (result.object.field_ids ?? []).filter((id) => validIds.has(id))

    await supabase
      .from('fields')
      .update({ dossier_field_ids: fieldIds })
      .eq('id', field_id)

    return Response.json({ field_ids: fieldIds })
  } catch (error) {
    console.error('Dossier field selection error:', error)
    return new Response('AI generation failed', { status: 500 })
  }
}
