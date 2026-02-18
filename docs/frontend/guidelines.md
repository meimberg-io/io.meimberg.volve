# Global Frontend Guidelines

## Core Principles

- Prefer consistency over one-off styling.
- Reuse existing components before creating new ones.
- Keep UI behavior predictable across pages and modals.
- Prefer small, composable components with clear props.

## Styling

- Use Tailwind utility classes and existing UI primitives.
- Avoid inline styles unless unavoidable.
- Keep spacing, border, color, and typography aligned with existing patterns.
- For interactive controls, ensure `cursor-pointer` where applicable.

## Dialogs and Forms

- Reuse dialog structure from existing modals:
  - header with title/description
  - scrollable body for long content
  - clear footer actions
- Keep form labels, input sizes, and button hierarchy consistent.
- Preserve accessibility basics: labels, keyboard navigation, and focus states.

## Rich Text / Markdown

- Use shared markdown/tiptap wrappers instead of ad-hoc editor containers.
- Keep editor focus and scrollbar styling consistent with modal/field patterns.
- Prefer shared props for min/max height and text sizing.

## Data and UX

- Keep optimistic updates and invalidation patterns consistent with React Query usage in existing pages.
- Show loading states and empty states for new views.
- Avoid destructive actions without confirmation.
