"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Download, Loader2, FileText, Check, MinusCircle, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AiButton } from "@/components/ui/ai-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  fieldContentToMarkdown,
  taskListToMarkdown,
  sanitizeFilename,
  triggerMarkdownDownload,
} from "@/lib/markdown-export"
import {
  buildDossierDocx,
  triggerDocxDownload,
  type DossierSection,
} from "@/lib/word-export"
import type { Field, TaskListItem } from "@/types"

interface DossierFieldCardProps {
  field: Field
  processId: string
  onUpdate: () => void
}

interface ReferencedFieldData {
  id: string
  name: string
  type: string
  content: string | null
  status: string | null
  step_name: string
  stage_name: string
}

interface ProcessFieldInfo {
  id: string
  name: string
  type: string
  step_name: string
  stage_name: string
}

const RENDERABLE_TYPES = new Set(["text", "long_text", "task_list", "task"])

export function DossierFieldCard({ field, processId, onUpdate }: DossierFieldCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(field.dossier_field_ids ?? [])
  const [refFields, setRefFields] = useState<ReferencedFieldData[]>([])
  const [allProcessFields, setAllProcessFields] = useState<ProcessFieldInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [description, setDescription] = useState(field.description ?? "")
  const descDebounce = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSelectedIds(field.dossier_field_ids ?? [])
  }, [field.dossier_field_ids?.join(",")])

  const loadAllProcessFields = useCallback(async () => {
    const supabase = createClient()
    const { data: stages } = await supabase
      .from("stages")
      .select("id, name")
      .eq("process_id", processId)
      .order("order_index")
    const stageIds = (stages ?? []).map((s) => s.id)
    if (!stageIds.length) { setAllProcessFields([]); return }

    const { data: steps } = await supabase
      .from("steps")
      .select("id, name, stage_id")
      .in("stage_id", stageIds)
      .order("order_index")
    const stepIds = (steps ?? []).map((s) => s.id)
    if (!stepIds.length) { setAllProcessFields([]); return }

    const { data: fields } = await supabase
      .from("fields")
      .select("id, name, type, step_id")
      .in("step_id", stepIds)
      .order("order_index")

    const stageMap = Object.fromEntries((stages ?? []).map((s) => [s.id, s.name]))
    const stepMap = Object.fromEntries((steps ?? []).map((s) => [s.id, { name: s.name, stage_id: s.stage_id }]))

    const mapped = (fields ?? [])
      .filter((f) => f.id !== field.id && RENDERABLE_TYPES.has(f.type))
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        step_name: stepMap[f.step_id]?.name ?? "",
        stage_name: stageMap[stepMap[f.step_id]?.stage_id] ?? "",
      }))
    setAllProcessFields(mapped)
  }, [processId, field.id])

  const loadRefFields = useCallback(async () => {
    if (!selectedIds.length) {
      setRefFields([])
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from("fields")
      .select("id, name, type, content, status, step:steps(name, stage:stages(name))")
      .in("id", selectedIds)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = (data ?? []).map((f: any) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      content: f.content,
      status: f.status,
      step_name: f.step?.name ?? "",
      stage_name: f.step?.stage?.name ?? "",
    }))

    const ordered = selectedIds
      .map((id) => mapped.find((f) => f.id === id))
      .filter(Boolean) as ReferencedFieldData[]

    setRefFields(ordered)
    setLoading(false)
  }, [selectedIds.join(",")])

  useEffect(() => { loadRefFields() }, [loadRefFields])
  useEffect(() => { loadAllProcessFields() }, [loadAllProcessFields])

  const saveFieldIds = async (ids: string[]) => {
    setSelectedIds(ids)
    const supabase = createClient()
    await supabase
      .from("fields")
      .update({ dossier_field_ids: ids })
      .eq("id", field.id)
    onUpdate()
  }

  const saveDescription = (value: string) => {
    if (descDebounce.current) clearTimeout(descDebounce.current)
    descDebounce.current = setTimeout(async () => {
      const supabase = createClient()
      await supabase
        .from("fields")
        .update({ description: value || null })
        .eq("id", field.id)
    }, 1000)
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    saveDescription(value)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/dossier-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_id: field.id, process_id: processId }),
      })
      if (!res.ok) throw new Error("Generation fehlgeschlagen")
      const { field_ids } = await res.json()
      setSelectedIds(field_ids)
      onUpdate()
    } finally {
      setGenerating(false)
    }
  }

  const handleRemoveField = (id: string) => {
    saveFieldIds(selectedIds.filter((x) => x !== id))
  }

  const handleAddField = (id: string) => {
    if (!selectedIds.includes(id)) {
      saveFieldIds([...selectedIds, id])
    }
  }

  const allRefDone = refFields.length > 0 && refFields.every(
    (f) => f.status === "closed" || f.status === "skipped"
  )
  const doneCount = refFields.filter(
    (f) => f.status === "closed" || f.status === "skipped"
  ).length

  const availableToAdd = allProcessFields.filter(
    (f) => !selectedIds.includes(f.id)
  )

  const fetchDossierData = async () => {
    const supabase = createClient()

    const { data: freshFields } = await supabase
      .from("fields")
      .select("id, name, type, content, step:steps(name, stage:stages(name))")
      .in("id", selectedIds)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldMap = new Map((freshFields ?? []).map((f: any) => [f.id, {
      id: f.id,
      name: f.name,
      type: f.type,
      content: f.content as string | null,
      step_name: f.step?.name ?? "",
      stage_name: f.step?.stage?.name ?? "",
    }]))

    const ordered = selectedIds
      .map((id) => fieldMap.get(id))
      .filter(Boolean) as { id: string; name: string; type: string; content: string | null; step_name: string; stage_name: string }[]

    const sections: DossierSection[] = []
    for (const ref of ordered) {
      const section: DossierSection = {
        stage_name: ref.stage_name,
        step_name: ref.step_name,
        field_name: ref.name,
        field_type: ref.type,
        content: ref.content,
      }
      if (ref.type === "task_list") {
        const { data: items } = await supabase
          .from("task_list_items")
          .select("*")
          .eq("field_id", ref.id)
          .order("order_index")
        section.task_items = (items as TaskListItem[]) ?? []
      }
      sections.push(section)
    }
    return sections
  }

  const handleDownload = async (format: "md" | "docx") => {
    if (!selectedIds.length) return
    setDownloading(true)
    try {
      const sections = await fetchDossierData()
      const filename = sanitizeFilename(field.name)

      if (format === "docx") {
        const doc = buildDossierDocx(field.name ?? "Dossier", sections)
        await triggerDocxDownload(doc, `${filename}.docx`)
      } else {
        const mdSections: string[] = []
        let lastStage = ""
        let lastStep = ""
        for (const s of sections) {
          if (s.stage_name !== lastStage) {
            mdSections.push(`# ${s.stage_name}`)
            lastStage = s.stage_name
            lastStep = ""
          }
          if (s.step_name !== lastStep) {
            mdSections.push(`## ${s.step_name}`)
            lastStep = s.step_name
          }
          mdSections.push(`### ${s.field_name}`)
          if (s.field_type === "task_list" && s.task_items) {
            mdSections.push(taskListToMarkdown(s.task_items))
          } else {
            mdSections.push(fieldContentToMarkdown(s.content, s.field_type))
          }
          mdSections.push("")
        }
        triggerMarkdownDownload(mdSections.join("\n\n"), `${filename}.md`)
      }
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="field-card field-card-open animate-pulse">
        <div className="h-4 bg-secondary rounded w-1/3 mb-4" />
        <div className="h-12 bg-secondary rounded" />
      </div>
    )
  }

  const groupedAvailable = availableToAdd.reduce<Record<string, Record<string, ProcessFieldInfo[]>>>(
    (acc, f) => {
      if (!acc[f.stage_name]) acc[f.stage_name] = {}
      if (!acc[f.stage_name][f.step_name]) acc[f.stage_name][f.step_name] = []
      acc[f.stage_name][f.step_name].push(f)
      return acc
    },
    {}
  )

  return (
    <div
      className={cn(
        "field-card",
        allRefDone ? "field-card-closed" : "field-card-open",
        "bg-card/80"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "-mx-4 -mt-4 mb-3 px-4 py-2.5 rounded-t-lg",
          allRefDone ? "bg-emerald-500/8" : "bg-indigo-500/8"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <h4 className="text-sm font-medium">{field.name ?? "Dossier"}</h4>
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-normal bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              Dossier
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {allRefDone && (
              <Badge variant="secondary" className="gap-1 bg-emerald-500/20 text-emerald-400">
                <Check className="h-3 w-3" />
                Erledigt
              </Badge>
            )}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      disabled={downloading || refFields.length === 0}
                    >
                      {downloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Herunterladen</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload("docx")} className="text-xs gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("md")} className="text-xs gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Markdown (.md)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Description + Generate */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Beschreibung
          </p>
          <AiButton
            aiVariant="execution"
            loading={generating}
            disabled={!description.trim()}
            onClick={handleGenerate}
            title={!description.trim() ? "Erst eine Beschreibung eingeben" : undefined}
          >
            Generieren
          </AiButton>
        </div>
        <Textarea
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder={'Beschreibe das gew\u00fcnschte Dokument, z.\u00a0B. \u201eRequirements Specification\u201c...'}
          rows={2}
        />
      </div>

      {/* Reference fields list */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
          Referenzierte Felder {selectedIds.length > 0 && `(${doneCount}/${refFields.length})`}
        </p>

        {refFields.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            {description.trim()
              ? 'Klicke „Generieren", um Referenzfelder automatisch auszuwählen.'
              : "Beschreibung eingeben und generieren, oder Felder manuell hinzufügen."}
          </p>
        ) : (
          refFields.map((ref) => {
            const done = ref.status === "closed" || ref.status === "skipped"
            return (
              <div
                key={ref.id}
                className="flex items-center gap-2 text-xs py-0.5 group"
              >
                {done ? (
                  ref.status === "skipped"
                    ? <MinusCircle className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    : <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                ) : (
                  <span className="inline-block h-3 w-3 rounded-full border border-border/50 shrink-0" />
                )}
                <span className={cn(done && "text-muted-foreground")}>{ref.name}</span>
                <span className="text-[10px] text-muted-foreground/60 ml-auto mr-1">
                  {ref.stage_name} &rsaquo; {ref.step_name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveField(ref.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-opacity shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })
        )}

        {/* Add field dropdown */}
        {availableToAdd.length > 0 && (
          <Select
            value=""
            onValueChange={(value) => { if (value) handleAddField(value) }}
          >
            <SelectTrigger className="mt-2 text-xs h-8">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Plus className="h-3 w-3" />
                <SelectValue placeholder="Feld hinzufügen..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(groupedAvailable).map(([stageName, steps]) => (
                <SelectGroup key={stageName}>
                  <SelectLabel className="text-[10px] uppercase tracking-wide">{stageName}</SelectLabel>
                  {Object.entries(steps).map(([stepName, fields]) =>
                    fields.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">
                        <span>{stepName} &rsaquo; {f.name}</span>
                        <Badge variant="secondary" className="ml-2 h-3.5 px-1 text-[8px] font-normal">
                          {f.type === "task_list" ? "Task Liste" : f.type}
                        </Badge>
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
