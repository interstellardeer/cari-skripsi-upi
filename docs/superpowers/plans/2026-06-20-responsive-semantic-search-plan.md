# Responsive Semantic Search Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the "Pencarian Semantik" tab to match the modern, full-viewport layout of the "Natural Language" chatbot tab.

**Architecture:** Lock main body scroll universally upon page mount. Refactor the page container layout to occupy `h-[calc(100dvh-3.5rem)]` with `overflow-hidden`. Divide the layout into a scrollable search results viewport (`max-w-3xl mx-auto flex-1 overflow-y-auto`) and a sticky bottom container that holds a slide-up collapsible filter panel and a search row.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, Lucide React, Bun.

## Global Constraints

- Lock body scroll universally when mounting the search page.
- Layout must be full-screen below the header (`h-[calc(100dvh-3.5rem)]`) with double scrollbars prevented.
- Centered layout on desktop (`max-w-3xl`) and full width on mobile for both results and inputs.
- Use `SlidersHorizontal` button to toggle the collapsible slide-up filter panel.
- Pinned CC BY-SA 4.0 license attribution in the UI footer.

---

### Task 11: Add Unit Tests for Layout Refactoring

**Files:**
- Modify: `ui/tests/frontend.test.tsx`

**Interfaces:**
- Consumes: None
- Produces: Test assertions for the new bottom search layout components (input, slide-up filter toggle button, welcome state).

- [ ] **Step 1: Modify tests in ui/tests/frontend.test.tsx**

Add test cases in `ui/tests/frontend.test.tsx` to assert that:
1. The welcome state is rendered by default with custom search query chips.
2. The bottom search input with id `semantic-search-input` is present.
3. The filter toggle button showing a `SlidersHorizontal` (or `SlidersHorizontal` class/role) icon is present.

```typescript
  it('renders semantic search bottom layout elements', () => {
    const { getByPlaceholderText, getByText } = render(React.createElement(SearchDashboard));
    // Verify search input is present in semantic search view
    expect(getByPlaceholderText('Cari topik skripsi, misalnya: media pembelajaran berbasis web...')).toBeDefined();
    // Verify welcome state query chips are present
    expect(getByText('pembelajaran berbasis game')).toBeDefined();
  });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `bun test tests/frontend.test.tsx`
Expected: Fail if the current page.tsx does not have the updated layouts or welcome state chips.

- [ ] **Step 3: Commit**

```bash
git add ui/tests/frontend.test.tsx
git commit -m "test: add layout assertions for responsive semantic search"
```

---

### Task 12: Refactor Search Dashboard and Lock Body Scroll

**Files:**
- Modify: `ui/app/(protected)/search/page.tsx`

**Interfaces:**
- Consumes: Lucide React icons (`SlidersHorizontal`, `Search`, `Send`, `ExternalLink`, `Bot`, `User`), React hooks (`useState`, `useRef`, `useEffect`).
- Produces: Universal scroll lock on mount, updated full-viewport layout with scrollable semantic search results area and sticky bottom search bar with slide-up filter card.

- [ ] **Step 1: Write implementation changes in page.tsx**

1. Modify `useEffect` for scroll locking to lock body scroll universally regardless of the active tab:
```typescript
  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);
```
2. Introduce state for filters toggle:
```typescript
  const [showFilters, setShowFilters] = useState(false);
```
3. Update the `main` tag and layout classes. Make `main` a fixed viewport container:
```typescript
  <main className="flex-1 flex flex-col min-h-0 w-full h-[calc(100dvh-3.5rem)] overflow-hidden bg-background">
```
4. Structure the `Tabs` and the container tabs triggering headers. Center the `TabsList` trigger:
```typescript
  <div className="px-4 pt-4 pb-2 shrink-0 w-full">
    <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
      <TabsTrigger value="semantic">Pencarian Semantik</TabsTrigger>
      <TabsTrigger value="chat">Natural Language (RAG)</TabsTrigger>
    </TabsList>
  </div>
```
5. Modify `TabsContent` for `semantic`. It should occupy full flex-1 layout, hiding overflow:
```typescript
  <TabsContent value="semantic" className="flex-1 min-h-0 m-0 p-0 border-0 flex flex-col focus-visible:ring-0 focus-visible:ring-offset-0">
```
6. Implement the scrollable results area in semantic tab:
```typescript
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 chat-scroll bg-background">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {loading ? (
          // Skeleton loader content here
        ) : !searched ? (
          // Centered landing welcome state with query chips
        ) : results.length === 0 ? (
          // No results text
        ) : (
          // Results cards rendering
        )}
      </div>
    </div>
```
7. Pinned welcome state in Results area:
```typescript
          <div className="h-full py-20 flex flex-col items-center justify-center text-center text-muted-foreground text-sm gap-3">
            <div className="h-12 w-12 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center text-foreground mb-2">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-base md:text-lg font-semibold text-foreground">
              Cari skripsi UPI menggunakan pencarian semantik (vektor).
            </p>
            <p className="text-sm max-w-md">
              Masukkan topik pencarian Anda di kolom bawah. Gunakan filter untuk hasil yang lebih spesifik.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-lg">
              {['pembelajaran berbasis game', 'kecerdasan buatan dalam pendidikan', 'media pembelajaran berbasis web', 'sistem informasi akademik'].map((chip) => (
                <Button
                  key={chip}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(chip)}
                  className="text-xs rounded-full"
                >
                  {chip}
                </Button>
              ))}
            </div>
          </div>
```
8. Sticky Bottom form area in semantic search tab:
```typescript
    <div className="border-t bg-background w-full shrink-0 py-3 md:py-4">
      <div className="max-w-3xl mx-auto w-full px-4 space-y-2">
        <form onSubmit={handleSemanticSearch} className="space-y-3">
          {showFilters && (
            <div className="bg-muted/50 border border-border/50 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Year from field */}
              {/* Year to field */}
              {/* Division/Faculty selector */}
              {/* Degree Type selector */}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("h-10 w-10 shrink-0", showFilters && "bg-accent text-accent-foreground")}
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Filter"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="semantic-search-input"
                className="pl-9 h-10 text-sm md:text-base"
                placeholder="Cari topik skripsi, misalnya: media pembelajaran berbasis web..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="h-10 px-4" disabled={loading}>
              Cari
            </Button>
          </div>
        </form>
        {/* Footer with CC license */}
        <p className="text-[10px] text-center text-muted-foreground leading-normal">
          Dataset berlisensi{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            CC BY-SA 4.0
          </a>{' '}
          —{' '}
          <a href="https://www.kaggle.com/datasets/arsyapermana/repository-universitas-pendidikan-indonesia-2025" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
            Repositori UPI
          </a>{' '}
          · 92.482 karya ilmiah
        </p>
      </div>
    </div>
```

- [ ] **Step 2: Run tests to verify passing**

Run: `bun test`
Expected: All tests pass, including the new frontend layout tests.

- [ ] **Step 3: Run production build check to ensure no TypeScript compilation issues**

Run: `bun run build`
Expected: Next.js production build completes successfully.

- [ ] **Step 4: Commit**

```bash
git add ui/app/\(protected\)/search/page.tsx
git commit -m "feat: refactor semantic search tab layout to match chatbot viewport height and add bottom sticky input bar"
```
