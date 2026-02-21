"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-actions";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Sparkles, Globe, Wrench, Play } from "lucide-react";
import { PromptField } from "@/components/field/PromptField";
import { getSettings, updateSetting } from "@/lib/data/settings";

const AI_MODEL_GROUPS = [
  {
    label: "OpenAI",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "gpt-5.2", label: "GPT-5.2" },
    ],
  },
  {
    label: "Anthropic Sonnet",
    models: [
      { id: "claude-3.5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    ],
  },
  {
    label: "Anthropic Opus",
    models: [
      { id: "claude-opus-4-20250514", label: "Claude Opus 4" },
      { id: "claude-opus-4-5-20251101", label: "Claude Opus 4.5" },
      { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
    ],
  },
] as const;

const PROMPT_KEYS = [
  {
    key: "tpl_describe_stage",
    label: "Stage-Beschreibung generieren",
    description: "Prompt-Template zum Generieren einer Beschreibung für eine einzelne Stage.",
    variables: ["stage_name", "process_description"],
  },
  {
    key: "tpl_describe_step",
    label: "Step-Beschreibung generieren",
    description: "Prompt-Template zum Generieren einer Beschreibung für einen einzelnen Step.",
    variables: ["step_name", "stage_name", "stage_description", "process_description"],
  },
  {
    key: "tpl_generate_stages",
    label: "Alle Stages generieren",
    description: "Prompt-Template zum Generieren aller Stages eines Prozesses.",
    variables: ["process_description"],
  },
  {
    key: "tpl_extend_stages",
    label: "Stages ergänzen",
    description: "Prompt-Template zum Ergänzen zusätzlicher Stages zu einem Prozess, der bereits Stages enthält.",
    variables: ["process_description", "existing_items", "user_prompt"],
  },
  {
    key: "tpl_generate_steps",
    label: "Steps + Fields generieren",
    description: "Prompt-Template zum Generieren aller Steps mit Fields für eine Stage.",
    variables: ["stage_name", "stage_description", "process_description"],
  },
  {
    key: "tpl_extend_steps",
    label: "Steps + Fields ergänzen",
    description: "Prompt-Template zum Ergänzen zusätzlicher Steps zu einer Stage, die bereits Steps enthält.",
    variables: ["stage_name", "stage_description", "process_description", "existing_items", "user_prompt"],
  },
  {
    key: "tpl_generate_dependencies",
    label: "Dependencies generieren",
    description: "Prompt-Template zum Generieren von Abhängigkeiten zwischen Fields.",
    variables: ["fields_list"],
  },
  {
    key: "tpl_header_image",
    label: "Headerbild generieren",
    description: "DALL-E Prompt zum Generieren eines Header-Bildes für ein Prozessmodell.",
    variables: ["process_description", "model_name", "user_prompt"],
  },
] as const;

function SavedIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-500">
      <Check className="h-3 w-3" />
      Gespeichert
    </span>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [envKeys, setEnvKeys] = useState<{ openai: string | null; anthropic: string | null }>({ openai: null, anthropic: null });
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
    fetch("/api/settings/env-keys")
      .then((r) => r.json())
      .then(setEnvKeys)
      .catch(() => {});
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved((prev) => ({ ...prev, [key]: false }));

    clearTimeout(debounceRefs.current[key]);
    debounceRefs.current[key] = setTimeout(async () => {
      await updateSetting(key, value);
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    }, 800);
  }, []);

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <h1 className="text-sm font-semibold">Einstellungen</h1>
        <p className="text-xs text-muted-foreground">
          App-Konfiguration und KI-Einstellungen
        </p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList>
          <TabsTrigger value="ai" className="text-xs cursor-pointer">KI-Konfiguration</TabsTrigger>
          <TabsTrigger value="prompts" className="text-xs cursor-pointer">Template-Prompts</TabsTrigger>
          <TabsTrigger value="display" className="text-xs cursor-pointer">Darstellung</TabsTrigger>
        </TabsList>

        {/* ==================== KI-Konfiguration ==================== */}
        <TabsContent value="ai" className="space-y-5 mt-4">
          {/* Model + API Keys */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Modell &amp; API-Schlüssel</CardTitle>
              <CardDescription className="text-xs">
                KI-Modell und Zugangsdaten. Wenn kein Schlüssel eingetragen ist, wird die Umgebungsvariable verwendet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <FormField
                label="KI-Modell"
                htmlFor="ai-model"
                actions={<SavedIndicator show={!!saved["ai_model"]} />}
              >
                <Select
                  value={settings["ai_model"] || "gpt-5.2"}
                  onValueChange={(value) => handleChange("ai_model", value)}
                >
                  <SelectTrigger id="ai-model" className="w-full text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODEL_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.models.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Gilt global für alle KI-Generierungen (außer Bildgenerierung).
                </p>
              </FormField>
              <Separator />
              <FormField
                label="OpenAI API Key"
                htmlFor="openai-key"
                actions={<SavedIndicator show={!!saved["openai_api_key"]} />}
              >
                <Input
                  id="openai-key"
                  type="password"
                  placeholder={envKeys.openai ?? "sk-... (keine ENV-Variable gesetzt)"}
                  value={settings["openai_api_key"] ?? ""}
                  onChange={(e) => handleChange("openai_api_key", e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  {envKeys.openai ? "Leer lassen, um die Umgebungsvariable zu verwenden." : "Keine Umgebungsvariable konfiguriert."}
                </p>
              </FormField>
              <FormField
                label="Anthropic API Key"
                htmlFor="anthropic-key"
                actions={<SavedIndicator show={!!saved["anthropic_api_key"]} />}
              >
                <Input
                  id="anthropic-key"
                  type="password"
                  placeholder={envKeys.anthropic ?? "sk-ant-... (keine ENV-Variable gesetzt)"}
                  value={settings["anthropic_api_key"] ?? ""}
                  onChange={(e) => handleChange("anthropic_api_key", e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  {envKeys.anthropic ? "Leer lassen, um die Umgebungsvariable zu verwenden." : "Keine Umgebungsvariable konfiguriert."}
                </p>
              </FormField>
            </CardContent>
          </Card>

          {/* System Prompts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">System-Prompts</CardTitle>
              <CardDescription className="text-xs">
                Globale und kontextspezifische System-Anweisungen, die bei jeder KI-Generierung mitgeschickt werden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <p className="text-xs text-muted-foreground">Lade Einstellungen...</p>
              ) : (
                <>
                  <FormField
                    label={
                      <span className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-red-400" />
                        System-Prompt Global
                      </span>
                    }
                    htmlFor="ai_meta_prompt"
                    actions={<SavedIndicator show={!!saved["ai_meta_prompt"]} />}
                  >
                    <p className="text-[11px] text-muted-foreground">
                      Wird bei jeder KI-Generierung als zusätzliche Anweisung angehängt (Modellierung + Ausführung).
                    </p>
                    <PromptField
                      id="ai_meta_prompt"
                      variant="global"
                      value={settings["ai_meta_prompt"] ?? ""}
                      rows={3}
                      placeholder="z.B. Keine Rückfragen, keine Meta-Kommentare..."
                      onChange={(e) => handleChange("ai_meta_prompt", e.target.value)}
                    />
                  </FormField>

                  <Separator />

                  <FormField
                    label={
                      <span className="flex items-center gap-1.5">
                        <Wrench className="h-3 w-3 text-amber-400" />
                        System-Prompt Modellierung
                      </span>
                    }
                    htmlFor="ai_system_modelling"
                    actions={<SavedIndicator show={!!saved["ai_system_modelling"]} />}
                  >
                    <p className="text-[11px] text-muted-foreground">
                      Rolle der KI beim Erstellen und Bearbeiten von Templates (Stages, Steps, Beschreibungen).
                    </p>
                    <PromptField
                      id="ai_system_modelling"
                      variant="modelling"
                      value={settings["ai_system_modelling"] ?? ""}
                      rows={3}
                      placeholder="z.B. Du bist ein erfahrener Prozess-Designer..."
                      onChange={(e) => handleChange("ai_system_modelling", e.target.value)}
                    />
                  </FormField>

                  <Separator />

                  <FormField
                    label={
                      <span className="flex items-center gap-1.5">
                        <Play className="h-3 w-3 text-blue-400" />
                        System-Prompt Ausführung
                      </span>
                    }
                    htmlFor="ai_system_execution"
                    actions={<SavedIndicator show={!!saved["ai_system_execution"]} />}
                  >
                    <p className="text-[11px] text-muted-foreground">
                      Standard-Rolle der KI bei der Prozessausführung (Fallback, wenn kein Prozess- oder Stage-spezifischer Prompt gesetzt ist).
                    </p>
                    <PromptField
                      id="ai_system_execution"
                      variant="execution"
                      value={settings["ai_system_execution"] ?? ""}
                      rows={3}
                      placeholder="z.B. Du bist ein erfahrener Business-Berater..."
                      onChange={(e) => handleChange("ai_system_execution", e.target.value)}
                    />
                  </FormField>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Template-Prompts ==================== */}
        <TabsContent value="prompts" className="space-y-5 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-sm">Template-KI-Prompts</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Prompt-Templates für die KI-gestützte Template-Generierung. Verwende Platzhalter in doppelten geschweiften Klammern.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <p className="text-xs text-muted-foreground">Lade Einstellungen...</p>
              ) : (
                PROMPT_KEYS.map((prompt, idx) => (
                  <div key={prompt.key}>
                    {idx > 0 && <Separator className="mb-5" />}
                    <FormField
                      label={prompt.label}
                      htmlFor={prompt.key}
                      actions={<SavedIndicator show={!!saved[prompt.key]} />}
                    >
                      <p className="text-[11px] text-muted-foreground">{prompt.description}</p>
                      <PromptField
                        id={prompt.key}
                        value={settings[prompt.key] ?? ""}
                        rows={5}
                        className="font-mono"
                        placeholder="Prompt-Template eingeben..."
                        onChange={(e) => handleChange(prompt.key, e.target.value)}
                      />
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {prompt.variables.map((v) => (
                          <Badge
                            key={v}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-mono text-amber-400/70 border-amber-400/20"
                          >
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </FormField>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== Darstellung ==================== */}
        <TabsContent value="display" className="space-y-5 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Darstellung</CardTitle>
              <CardDescription className="text-xs">
                Visuelle Einstellungen der Anwendung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Dark Mode</p>
                  <p className="text-[11px] text-muted-foreground">Standardmäßig aktiviert</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7 px-3" disabled>
                  Aktiv
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Sprache</p>
                  <p className="text-[11px] text-muted-foreground">Deutsch (Standard)</p>
                </div>
                <Button variant="outline" size="sm" className="text-xs h-7 px-3" disabled>
                  DE
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
