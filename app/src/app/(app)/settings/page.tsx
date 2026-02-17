"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { PromptField } from "@/components/field/PromptField";
import { getSettings, updateSetting } from "@/lib/data/settings";

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
] as const;

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
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
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-sm font-semibold">Einstellungen</h1>
        <p className="text-xs text-muted-foreground">
          App-Konfiguration und KI-Einstellungen
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">KI-Konfiguration</CardTitle>
          <CardDescription className="text-xs">
            API-Schlüssel für die KI-Generierung. Schlüssel werden über Umgebungsvariablen konfiguriert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="openai-key" className="text-xs">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              className="text-xs!"
              disabled
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anthropic-key" className="text-xs">Anthropic API Key</Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-..."
              className="text-xs!"
              disabled
            />
          </div>
        </CardContent>
      </Card>

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
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={prompt.key} className="text-xs font-medium">
                      {prompt.label}
                    </Label>
                    {saved[prompt.key] && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                        <Check className="h-3 w-3" />
                        Gespeichert
                      </span>
                    )}
                  </div>
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
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
