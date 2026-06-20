# Absolute Slide-Up Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the slide-up filter panel in the "Pencarian Semantik" tab to float absolutely over the results viewport, preventing layout shifts, and add a close (X) button inside the panel.

**Architecture:** Use `relative` positioning on the bottom sticky form wrapper. Position the filter card `absolute bottom-full left-4 right-4 mb-2 z-20` so it hovers over the results list rather than pushing it. Add a fade-slide-up keyframe animation for smooth toggle transition. Add a close `X` icon button in the top-right corner of the filter panel.

**Tech Stack:** Next.js, Tailwind CSS v4, Lucide React, Bun.

## Global Constraints

- Never cause layout jumps or push results when filters are toggled.
- Positioning of the filter panel must be absolute relative to the sticky bottom input row container.
- Include a close button (`X` icon) to hide the panel.
- Ensure all tests continue to pass.

---

### Task 13: Add Custom Fade-Slide-Up Keyframe Animations

**Files:**
- Modify: `ui/app/globals.css`

**Interfaces:**
- Consumes: Tailwind styles
- Produces: CSS utility `.animate-slide-up` for smooth slide-up animation.

- [ ] **Step 1: Edit ui/app/globals.css to append keyframes and animation utility**

Add the `@keyframes` block and `.animate-slide-up` utility class:
```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slideUp 0.15s ease-out forwards;
}
```

- [ ] **Step 2: Save the file**

---

### Task 14: Implement Absolute Hover Filter Panel and Close Button

**Files:**
- Modify: `ui/app/(protected)/search/page.tsx`
- Modify: `ui/tests/frontend.test.tsx`

**Interfaces:**
- Consumes: Lucide React `X` icon, `.animate-slide-up` class
- Produces: Absolute-positioned floating filter card with close button and smooth transitions.

- [ ] **Step 1: Modify tests in ui/tests/frontend.test.tsx**

Add a test case to simulate toggling the filter panel and verify the close button with `lucide-x` icon class is rendered.

```typescript
  it('toggles filter panel and displays close button', async () => {
    const { getByLabelText, container } = render(React.createElement(SearchDashboard));
    
    // Toggle filters ON
    const filterBtn = getByLabelText('Filter');
    fireEvent.click(filterBtn);
    
    // Verify close icon is rendered
    const closeIcon = container.querySelector('.lucide-x');
    expect(closeIcon).not.toBeNull();
  });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `bun test tests/frontend.test.tsx`
Expected: Fail since the close button/icon and `fireEvent` imports are not fully set up.

- [ ] **Step 3: Modify page.tsx**

1. Import `X` from `lucide-react`:
```typescript
import { Search, Send, ExternalLink, Bot, User, SlidersHorizontal, X } from 'lucide-react';
```

2. Locate the sticky bottom form area wrapper `div` (line 302-303) and add `relative` class:
```typescript
<div className="max-w-3xl mx-auto w-full px-4 space-y-2 relative">
```

3. Update the filter card container classes to be `absolute` and have `.animate-slide-up`:
```typescript
                  {showFilters && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 z-20 bg-card border border-border p-4 rounded-xl shadow-lg grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
```

4. Render a close button at the top-right corner of the absolute filter card container:
```typescript
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowFilters(false)}
                        aria-label="Tutup filter"
                      >
                        <X className="h-4 w-4" />
                      </Button>
```

5. Adjust the grid layout padding to prevent text overlapping the close button. Adding `pr-8` to the "Jenjang" column or general layout ensures space.

- [ ] **Step 4: Run tests to verify passing**

Run: `bun test`
Expected: PASS all tests.

- [ ] **Step 5: Run production build check**

Run: `bun run build` in `ui/`
Expected: Success.

- [ ] **Step 6: Commit**

```bash
git add ui/app/globals.css ui/app/\(protected\)/search/page.tsx ui/tests/frontend.test.tsx
git commit -m "feat: animate filter panel toggle using absolute overlay and add close button"
```
