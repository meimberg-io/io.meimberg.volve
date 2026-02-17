"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";
import { getSettings, updateSetting } from "@/lib/data/settings";

const PROMPT_KEYS = [
  {
    key: "tpl_describe_stage",
    label: "Stage-Beschreibung generieren",
    description: "Prompt-Template zum Generieren einer Beschreibung für eine einzelne Stage.",
    variables: "{{stage_name}}, {{process_description}}",
  },
  {
    key: "tpl_describe_step",
    label: "Step-Beschreibung generieren",
    description: "Prompt-Template zum Generieren einer Beschreibung für einen einzelnen Step.",
    variables: "{{step_name}}, {{stage_name}}, {{stage_description}}, {{process_description}}",
  },
  {
    key: "tpl_generate_stages",
    label: "Alle Stages generieren",
    description: "Prompt-Template zum Generieren aller Stages eines Prozesses.",
    variables: "{{process_description}}",
  },
  {
    key: "tpl_generate_steps",
    label: "Steps + Fields generieren",
    description: "Prompt-Template zum Generieren aller Steps mit Fields für eine Stage.",
    variables: "{{stage_name}}, {{stage_description}}, {{process_description}}",
  },
  {
    key: "tpl_generate_dependencies",
    label: "Dependencies generieren",
    description: "Prompt-Template zum Generieren von Abhängigkeiten zwischen Fields.",
    variables: "{{fields_list}}",
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-muted-foreground">
          App-Konfiguration und KI-Einstellungen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KI-Konfiguration</CardTitle>
          <CardDescription>
            API-Schlüssel für die KI-Generierung. Schlüssel werden verschlüsselt gespeichert.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              placeholder="sk-..."
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder="sk-ant-..."
              disabled
            />
          </div>
          <p className="text-xs text-muted-foreground">
            API-Schlüssel werden über Umgebungsvariablen konfiguriert.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template-KI-Prompts</CardTitle>
          <CardDescription>
            Prompt-Templates für die KI-gestützte Template-Generierung. Verwende Platzhalter in doppelten geschweiften Klammern.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Lade Einstellungen...</p>
          ) : (
            PROMPT_KEYS.map((prompt, idx) => (
              <div key={prompt.key}>
                {idx > 0 && <Separator className="mb-6" />}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={prompt.key}>{prompt.label}</Label>
                    {saved[prompt.key] && (
                      <span className="flex items-center gap-1 text-xs text-emerald-500">
                        <Check className="h-3 w-3" />
                        Gespeichert
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{prompt.description}</p>
                  <Textarea
                    id={prompt.key}
                    value={settings[prompt.key] ?? ""}
                    rows={6}
                    className="font-mono text-xs"
                    onChange={(e) => handleChange(prompt.key, e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground/70">
                    Variablen: {prompt.variables}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Darstellung</CardTitle>
          <CardDescription>
            Visuelle Einstellungen der Anwendung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Standardmäßig aktiviert</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Aktiv
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sprache</p>
              <p className="text-sm text-muted-foreground">Deutsch (Standard)</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              DE
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
