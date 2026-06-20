# UI Refactoring: Responsive Semantic Search Tab

## 1. Context & Objectives
- **Goal:** Redesign the "Pencarian Semantik" tab to match the modern, full-viewport layout of the "Natural Language" chatbot tab.
- **Key Requirements:**
  - Sticky bottom search input row with a max-width of `max-w-3xl` (centered on desktop, full width on mobile).
  - Collapsible, slide-up filter settings panel directly above the input bar.
  - Scrollable search results list area taking the remaining viewport height.
  - Centered landing/welcome state when no search query has been executed.

## 2. Layout Structure
- **Global Body Height:** Fixed at `h-[calc(100dvh-3.5rem)]` (below the header) with `overflow-hidden` to avoid double scrollbars on the page.
- **Scrollable Results Area:**
  - Takes `flex-1 overflow-y-auto w-full px-4 md:px-6`.
  - Max-width of `max-w-3xl mx-auto` to align with the RAG Chat tab.
  - Renders:
    - Welcome state (search icon, title, query chips) when empty.
    - Skeletons when loading.
    - Thesis card results when loaded.
- **Sticky Bottom Area:**
  - Border-t, padded container (`py-3 md:py-4 bg-background w-full shrink-0`).
  - Max-width content wrapper (`max-w-3xl mx-auto w-full px-4 space-y-2`).
  - Contains:
    - **Slide-up Filter Card:** Displayed only when `showFilters` state is true. Positioned directly above the search bar as a border-rounded, padded grid (2 columns on mobile, 4 columns on desktop) with:
      - "Tahun Dari" input field
      - "Tahun Sampai" input field
      - "Fakultas" dropdown selector
      - "Jenjang" dropdown selector
    - **Search Row:** Flex container holding:
      - **Filter Toggle Button:** Ghost icon button showing `SlidersHorizontal` to toggle `showFilters`.
      - **Search Input Field:** Text input with search placeholder and icon.
      - **Cari Button:** Primary button.
    - **License Attribution Footer:** CC BY-SA 4.0 and Kaggle dataset source links printed underneath.
