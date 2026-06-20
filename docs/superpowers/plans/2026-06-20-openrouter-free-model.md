# OpenRouter Free Model Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change OpenRouter models to `openrouter/free` in `/api/chat` to resolve token credit reservation errors.

**Architecture:** Update model identifiers for query reformulation and streaming chat response to `openrouter/free` inside the route handler.

**Tech Stack:** Vercel AI SDK (`ai`), `@ai-sdk/openai`, Bun

## Global Constraints

- Use bun to run tests.
- Maintain existing codebase structure.
- Add `// ponytail:` comment marking the simplification.

---

### Task 1: Update API Route to openrouter/free

**Files:**
- Modify: `app/api/chat/route.ts:48-52`, `app/api/chat/route.ts:95-99`

**Interfaces:**
- None

- [ ] **Step 1: Write minimal implementation changes**

Modify `app/api/chat/route.ts` to use `openrouter/free` for both LLM calls and add a `// ponytail:` comment explaining the simplification (that we are using a free auto-router to avoid credit reservation errors).

- [ ] **Step 2: Run tests to verify they still pass**

Run: `bun test`
Expected: 11 pass, 3 fail (the pre-existing 3 JSDOM failures are expected, but route tests should pass).

- [ ] **Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: change openrouter chat and reformulation models to openrouter/free"
```
