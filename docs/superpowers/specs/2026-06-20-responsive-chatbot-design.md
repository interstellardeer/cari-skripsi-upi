# UI Responsiveness & Chatbot Layout Design

## 1. Context & Objectives
- **Goal:** Improve the responsiveness of the web UI, apply best practices for typography/font sizes, and remodel the RAG Chat interface to feel like a premium, app-style chatbot (e.g. Claude or ChatGPT).
- **Approved Approach:** Approach B (Pure App-View Chat Layout) where:
  - The chat tab is full-screen below the header (`h-[calc(100dvh-3.5rem)]`).
  - The main scroll is locked on the body inside the chat tab.
  - The chat bubbles are centered on desktop (`max-w-3xl`) and occupy full width on mobile.
  - Typography sizes scale responsively (`text-sm` on mobile, `text-base` on desktop).

## 2. Layout Structure
- **Navbar:** Sticky at the top, height `h-14` (3.5rem).
- **Semantic Search Tab:** Regular page-scroll layout, containing search inputs, faculty/jenjang filters, result cards, and the standard footer.
- **RAG Chat Tab:** 
  - Adaptive container layout with viewport height constraint.
  - Scrolling messages list area (`flex-1 overflow-y-auto`).
  - Centered messaging bubbles (`max-w-3xl mx-auto`).
  - Pinned input panel at the bottom of the viewport with a subtle, tiny CC BY-SA 4.0 license note.

## 3. Typographical System (Best Practices)
- **Primary Body Font:** Geist Sans (default theme font).
- **Chat Bubbles:**
  - Font Size: `text-sm` (14px) on mobile, `text-base` (16px) on desktop.
  - Line Height: `leading-relaxed` (1.6) to increase readability of technical abstracts.
- **Headers & Titles:**
  - `text-lg` (mobile) to `text-xl` (desktop) for clean hierarchy.
- **Metadata and Badges:**
  - `text-xs` (12px) for year, author, and faculty badges.

## 4. UI Elements & Bubble Styles
- **User Messages:**
  - Color: `bg-primary text-primary-foreground`
  - Rounded Corners: `rounded-2xl rounded-tr-sm`
  - Alignment: Right aligned.
- **Assistant Messages:**
  - Color: `bg-muted/50 border border-border/50 text-foreground`
  - Rounded Corners: `rounded-2xl rounded-tl-sm`
  - Alignment: Left aligned.
  - Markdown Support: Rendered properly with clean spacing.
