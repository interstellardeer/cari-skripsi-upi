# Scroll Containment Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the issue where semantic search results are not scrollable, by adding strict flexbox scroll containment classes (`overflow-hidden`) to parent layout blocks.

**Architecture:** Add `overflow-hidden` to both the `Tabs` root component and both `TabsContent` panels. This forces the browser to constrain the height of the tab panels to the exact remaining viewport space, enabling scrolling on the results list.

**Tech Stack:** Next.js, Tailwind CSS, Bun.

## Global Constraints

- Force layout containment to prevent panels from expanding height-wise.
- Results list must scroll when height is exceeded.
- Ensure all tests continue to pass.

---

### Task 17: Apply Scroll Containment to Tabs and Panels

**Files:**
- Modify: `ui/app/(protected)/search/page.tsx`

**Interfaces:**
- Consumes: Tailwind classes
- Produces: Height-constrained search tab containers.

- [ ] **Step 1: Modify page.tsx**

1. Locate the `Tabs` component (around line 171) and append `overflow-hidden`:
```typescript
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
```

2. Locate the `TabsContent` for the `semantic` search tab and append `overflow-hidden`:
```typescript
          <TabsContent value="semantic" className="flex-1 min-h-0 m-0 p-0 border-0 flex flex-col overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0">
```

3. Locate the `TabsContent` for the `chat` RAG tab and append `overflow-hidden`:
```typescript
          <TabsContent
            value="chat"
            className="flex-1 min-h-0 m-0 p-0 border-0 flex flex-col overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
          >
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `bun test`
Expected: PASS.

- [ ] **Step 3: Run production build check**

Run: `bun run build` in `ui/`
Expected: Success.

- [ ] **Step 4: Commit changes**

```bash
git add ui/app/\(protected\)/search/page.tsx
git commit -m "fix: contain panel heights using overflow-hidden to fix scroll issues in semantic search results"
```
