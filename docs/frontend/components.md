# Frontend Component Reuse Guide

## UI Primitives (Preferred)

Use these first — they carry all default styling, so **no className overrides** are needed for standard usage:

- `components/ui/button.tsx` — actions, dialog/footer buttons. Includes `cursor-pointer` by default.
- `components/ui/input.tsx` — single-line text input. Defaults: `text-xs`, `border-border/50`, `bg-secondary/30`.
- `components/ui/textarea.tsx` — multiline plain text. Defaults: `text-xs`, `border-border/50`, `bg-secondary/30`.
- `components/ui/label.tsx` — form labels. Defaults: `text-xs font-medium uppercase tracking-wide text-muted-foreground`. Just use `<Label>Text</Label>` — no className needed.
- `components/ui/dialog.tsx` — modal shell.
- `components/ui/form-actions.tsx`:
  - `FormField` — standard label + children wrapper (`space-y-1.5`). Supports `label`, `htmlFor`, `actions` (slot next to label), and `className`. Use instead of manual `<div className="space-y-1.5"><Label>…</Label>…</div>`.
  - `SaveButton` (green) and `CancelButton` (red) for dialog footers and inline forms. Use instead of styling `<Button>` manually.

## Existing Domain Components

- `components/field/MarkdownEditor.tsx` — TipTap markdown editor with shared min/max height, editor class, and scrollbar styling.
- `components/field/MarkdownField.tsx` — standard markdown field wrapper (border, focus ring, scroll behavior).
- `components/field/PromptField.tsx` — amber prompt textarea style used in AI flows.
- `components/field/TaskFieldCard.tsx` — single-task field card (description, assignee, status, result).
- `components/field/TaskListFieldCard.tsx` — task-list field card (multiple tasks per field: title, notes, type self/delegated, status, result with AI polish). Renders status indicator (red/yellow/green) and "Taskliste generieren" when `ai_prompt` is set.
- `components/field/DossierFieldCard.tsx` — dossier field card (references other fields; displays completion status of referenced fields and provides a single download button to export all referenced content as a combined Markdown document with H1/H2/H3 hierarchy). No editor, no manual content.
- `components/ui/ai-button.tsx` — consistent AI action button style.

## Reuse Rules

- Do not add `text-xs`, `border-border/50`, `bg-secondary/30`, or `uppercase tracking-wide text-muted-foreground` to individual `<Input>`, `<Textarea>`, or `<Label>` usages — these are built into the base components.
- Do not duplicate field wrappers for markdown editors.
- Do not hardcode one-off modal button styles — use `SaveButton` / `CancelButton` from `form-actions.tsx`.
- For new form sections, use `<FormField label="…">` instead of manual `<div className="space-y-1.5"><Label>…</Label>…</div>`. Do not import `Label` directly — it's handled by `FormField`.
- When creating a new reusable component, place it in `components/ui` or `components/field` if broadly applicable.

## When to Create a New Shared Component

Create one only if all are true:

1. Pattern appears in at least 2 places.
2. Behavior/styling should remain identical.
3. Props can stay simple and obvious.
