"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
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
