# Responsive Chatbot Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve responsive web UI, typography scaling, and remodel the RAG Chat tab to be a pure full-screen app-view chat layout matching design specs.

**Architecture:** Lock main body scroll inside RAG Chat, constrain viewport height to 100dvh minus header (3.5rem), center messages on desktop using max-w-3xl, and scale chat bubble typography responsively.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4, Lucide React, Bun.

## Global Constraints

- Approach B (Pure App-View Chat Layout) where: The chat tab is full-screen below the header (`h-[calc(100dvh-3.5rem)]`).
- The main scroll is locked on the body inside the chat tab.
- The chat bubbles are centered on desktop (`max-w-3xl`) and occupy full width on mobile.
- Typography sizes scale responsively (`text-sm` on mobile, `text-base` on desktop).
- Primary Body Font: Geist Sans (default theme font).
- Chat Bubbles Font Size: `text-sm` (14px) on mobile, `text-base` (16px) on desktop.
- Chat Bubbles Line Height: `leading-relaxed` (1.6) to increase readability of technical abstracts.
- User Messages Color: `bg-primary text-primary-foreground`, rounded corners: `rounded-2xl rounded-tr-sm`, right-aligned.
- Assistant Messages Color: `bg-muted/50 border border-border/50 text-foreground`, rounded corners: `rounded-2xl rounded-tl-sm`, left-aligned, markdown support rendered properly with clean spacing.

---

### Task 1: Sleek CSS Custom Styles
**Files:**
- Modify: `ui/app/globals.css`

**Interfaces:**
- Consumes: Tailwind v4 variables
- Produces: CSS utility `.chat-scroll` for custom thin, premium scrollbars.

- [ ] **Step 1: Write minimal implementation in globals.css**

Add custom scrollbar utility at the end of `ui/app/globals.css`:
```css
/* Custom scrollbar styling for a premium chat experience */
.chat-scroll::-webkit-scrollbar {
  width: 6px;
}

.chat-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.chat-scroll::-webkit-scrollbar-thumb {
  background: var(--muted);
  border-radius: 3px;
}

.chat-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground);
}
```

- [ ] **Step 2: Save and verify compilation**
No special command needed, just verify file content compiles correctly with Next.js compiler if we run build or dev.

---

### Task 2: Remodel Chat Page and Lock Body Scroll
**Files:**
- Modify: `ui/app/(protected)/search/page.tsx`
- Modify: `ui/tests/frontend.test.tsx`

**Interfaces:**
- Consumes: React hooks (`useState`, `useRef`, `useEffect`), `useChat` from `ai/react`
- Produces: Premium full-screen RAG Chat Layout under `h-[calc(100dvh-3.5rem)]` with body scroll locked, centering max-w-3xl, custom markdown text formatter, and responsive bubbles.

- [ ] **Step 1: Update frontend tests first to add tests for SearchDashboard layout**

Modify `ui/tests/frontend.test.tsx` to mock `ai/react` and import/test `SearchDashboard`.
Failing test assertion:
```typescript
import SearchDashboard from '../app/(protected)/search/page';

vi.mock('ai/react', () => ({
  useChat: () => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
  }),
}));

describe('SearchDashboard Component Layout', () => {
  it('renders search tab triggers and default inputs', () => {
    const { getByText, getByPlaceholderText } = render(React.createElement(SearchDashboard));
    expect(getByText('Pencarian Semantik')).toBeDefined();
    expect(getByText('Natural Language (RAG)')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `bun test tests/frontend.test.tsx`
Expected: Fail/Error due to missing mock of `ai/react` or syntax check.

- [ ] **Step 3: Implement responsive layout changes, markdown helper, and scroll lock**

1. Introduce custom `renderMarkdown` function at the top of the file (or outside the component).
2. Manage `activeTab` using a state hook:
```typescript
const [activeTab, setActiveTab] = useState('semantic');
```
3. Use a `useEffect` hook to lock document body scroll:
```typescript
  useEffect(() => {
    if (activeTab === 'chat') {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [activeTab]);
```
4. Adjust `main` container classes to toggle height & layout dynamically based on `activeTab === 'chat'`.
5. Containerize `TabsList` so it is centered on desktop chat view.
6. Replace the fixed height chat `Card` with a full-height, scrollable container with customized chat bubbles (`max-w-3xl mx-auto`), custom scrollbar class `.chat-scroll`, custom markdown-formatted assistant messages, and license note pinned at the bottom.

- [ ] **Step 4: Run test to verify it passes**
Run: `bun test`
Expected: PASS all 13 tests.

- [ ] **Step 5: Commit changes**
Run:
```bash
git add ui/app/globals.css ui/app/\(protected\)/search/page.tsx ui/tests/frontend.test.tsx
git commit -m "feat: implement responsive app-view chatbot layout and scroll lock"
```
