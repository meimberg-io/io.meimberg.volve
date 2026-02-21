---
name: improve-issue-spec
description: Improves a GitHub issue by turning it into a user story with acceptance criteria. Agent reads the issue, works through the concept, asks conceptual questions to the user in chat, incorporates answers, then saves the finalized spec to GitHub. No code changes. Use when the user wants to improve an issue spec, write a user story from an issue, or clarify an issue before implementing.
---

# Improve Issue Spec (User Story → Fragen → Finalisieren → GitHub)

Improve a GitHub issue's specification without touching code. Workflow: read issue → conceive fully → ask user conceptual questions in chat → incorporate answers → save finalized spec to GitHub.

## Scope

- **In scope:** Read issue (MCP `get_issue`), draft user story + acceptance criteria, identify open conceptual questions, ask user, incorporate answers, update issue (MCP `update_issue`).
- **Out of scope:** Any code, config, or repo file changes. No implementation.

## Workflow (strict order)

### 1. Resolve issue number and repo

- Issue number from user message (e.g. "Issue 3", "#3") or ask if missing.
- Repo: `meimberg-io` / `io.meimberg.volve` (or infer from `git remote -v` if different).

### 2. Fetch and understand the spec

- Call MCP `get_issue` (owner, repo, issue_number). If fetch fails, report and stop.
- Read and understand the current title and body.

### 3. Conceive fully

- Draft **user story:** "Als … möchte ich … damit …" (or project language).
- Draft **acceptance criteria:** concrete, testable bullets.
- Identify **open conceptual questions** (scope, data model, UX, product decisions) that need the user's input before the spec is final.

### 4. Ask the user (do not update GitHub yet)

- In chat: present the draft user story and acceptance criteria briefly.
- List the **conceptual questions** clearly and ask the user to answer them (or say "save as-is" / "ohne Antworten speichern" if they want the spec with open questions written into the issue).
- **Do not** call `update_issue` in this step. Wait for the user's answers.

### 5. Incorporate answers and finalize

- Once the user has answered (or said to save as-is): integrate answers into the spec (e.g. turn decisions into a short "Entscheidungen" section or fold them into criteria; reduce or drop open questions that are now resolved).
- Produce the **final issue body** (and optional title tweak).

### 6. Save spec to GitHub

- Call MCP `update_issue` with owner, repo, issue_number, and the finalized `body` (and `title` if changed).
- Confirm with the issue link (e.g. `https://github.com/meimberg-io/io.meimberg.volve/issues/<n>`).

## Output format

**When asking questions (step 4):** Show in chat:
- Short summary of current understanding
- Draft user story + acceptance criteria
- Numbered list of conceptual questions, then ask for answers

**Final issue body (step 6)** — use markdown, e.g.:

```markdown
## User Story
**Als** … **möchte ich** … **damit** …

### Akzeptanzkriterien
- …

---
## Entscheidungen (optional, wenn Fragen beantwortet)
- …

---
_Spec-Version: YYYY-MM-DD._
```

If the user saved "as-is", you may keep a "Konzeptionell offene Fragen" section in the issue body.

## MCP usage

- **get_issue:** `owner`, `repo`, `issue_number` (number).
- **update_issue:** only after step 5; `owner`, `repo`, `issue_number` required; `body` (and optionally `title`).

Do not run git commit, git push, or edit source/config files.
