# Brand Logo & Favicon Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the user-provided brand logo (`logo.PNG`) all across the UI and build, create the site favicon/icon, and place it in the navigation header beside the title.

**Architecture:** Copy `logo.PNG` to `ui/public/logo.png` to serve it statically, and copy it to `ui/app/icon.png` so Next.js App Router automatically generates the favicon and site icons. Update `Navbar.tsx` and `page.tsx` (landing page) to render the logo.

**Tech Stack:** Next.js, Tailwind CSS, Bun.

## Global Constraints

- Use the exact logo file at `logo.PNG`.
- Ensure Next.js App Router serves the favicon correctly via `ui/app/icon.png`.
- Ensure header brand link renders the logo on the left of the text title.
- Ensure all tests pass.

---

### Task 15: Copy Assets and Setup Next.js Favicon

**Files:**
- Create: `ui/public/logo.png`
- Create: `ui/app/icon.png`

**Interfaces:**
- Consumes: `logo.PNG`
- Produces: Static `/logo.png` asset and automatic App Router `icon.png` favicon mapping.

- [ ] **Step 1: Create directories and copy logo.PNG to target paths**

Run a command to create the `ui/public` directory and copy `logo.PNG` to `ui/public/logo.png` and `ui/app/icon.png`.

```powershell
New-Item -ItemType Directory -Force -Path "ui/public"
Copy-Item -Path "logo.PNG" -Destination "ui/public/logo.png" -Force
Copy-Item -Path "logo.PNG" -Destination "ui/app/icon.png" -Force
```

- [ ] **Step 2: Commit files**

```bash
git add ui/public/logo.png ui/app/icon.png
git commit -m "chore: copy brand logo to public assets and app icon paths"
```

---

### Task 16: Update Navbar, Landing Page, and Unit Tests

**Files:**
- Modify: `ui/components/Navbar.tsx`
- Modify: `ui/app/page.tsx`
- Modify: `ui/tests/frontend.test.tsx`

**Interfaces:**
- Consumes: Static `/logo.png` asset
- Produces: Header logo render, landing page brand logo render, updated unit tests.

- [ ] **Step 1: Modify ui/tests/frontend.test.tsx**

Update layout tests to assert that the `img` tag with src `/logo.png` is rendered in both the Navbar and SearchDashboard components.

```typescript
  it('renders real Navbar branding with logo and title', () => {
    const { getByText, container } = render(React.createElement(Navbar));
    expect(getByText('CariSkripsi')).toBeDefined();
    const logoImg = container.querySelector('img[src="/logo.png"]');
    expect(logoImg).not.toBeNull();
  });
```

- [ ] **Step 2: Run test to verify failure**

Run: `bun test tests/frontend.test.tsx`
Expected: Fail since the implementation is not yet updated.

- [ ] **Step 3: Modify ui/components/Navbar.tsx**

Update the brand render block:
```typescript
          {/* Brand */}
          <span className="flex items-center gap-2 font-semibold tracking-tight text-sm">
            <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
            <span>
              CariSkripsi <span className="text-muted-foreground">UPI</span>
            </span>
          </span>
```

- [ ] **Step 4: Modify ui/app/page.tsx**

Update the header title of the landing page to feature the logo on the left of the title:
```typescript
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Logo CariSkripsi UPI" className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-bold tracking-tight">CariSkripsi UPI</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Pencarian semantik repositori karya ilmiah Universitas Pendidikan Indonesia
          </p>
        </div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun test`
Expected: PASS.

- [ ] **Step 6: Run build verification check**

Run: `bun run build` in `ui/`
Expected: Production build compiles successfully.

- [ ] **Step 7: Commit changes**

```bash
git add ui/components/Navbar.tsx ui/app/page.tsx ui/tests/frontend.test.tsx
git commit -m "feat: integrate brand logo in navbar and landing page layout"
```
