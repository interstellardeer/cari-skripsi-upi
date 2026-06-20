# Design Spec: OpenRouter Model Change to Auto-Router & Token Error Fix

- **Date:** 2026-06-20
- **Status:** Approved
- **Topic:** Changing chat provider to OpenRouter free auto-router and resolving the "need 2000 tokens" error.

---

## 1. Problem Description
Users encountered credit/token reservation errors (such as "need 2000 tokens" or "requires more credits") when initiating a chat.
This is because OpenRouter reserves credits equal to `max_tokens` (2000 tokens in our configuration) multiplied by the model's rate before beginning the stream for paid models (`google/gemini-2.5-flash` and `openai/gpt-4o-mini`). With $0 or insufficient credits, this check fails.

---

## 2. Solution Approach
We will switch the LLM calls in `/api/chat` from paid models to the free auto-router:
- **Chat Response Model:** Switch from `google/gemini-2.5-flash` to `openrouter/free`.
- **Query Reformulation Model:** Switch from `openai/gpt-4o-mini` to `openrouter/free`.

Using `openrouter/free` bypasses credit/token checks for these requests, allowing the chat interface to function without credit balance errors.

> [!NOTE]
> The embedding model (`openai/text-embedding-3-small` in `service` package) remains paid as OpenRouter does not host free embedding models. If the API key's credits are completely exhausted, embeddings will fail, but since their token cost is extremely low and no `max_tokens` reservation check is done, they currently pass.

---

## 3. Code Changes

### `app/api/chat/route.ts`

```diff
@@ -47,3 +47,3 @@
     const { text: queryText } = await generateText({
-      model: openRouter('openai/gpt-4o-mini') as any,
+      model: openRouter('openrouter/free') as any,
       system: 'Reformulasikan input akademik menjadi 2-5 kata kunci pencarian skripsi dalam Bahasa Indonesia berdasarkan konteks percakapan. Tuliskan HANYA kata kunci tersebut tanpa tanda baca atau teks penjelasan.',
@@ -94,3 +94,3 @@
     const result = await streamText({
-      model: openRouter('google/gemini-2.5-flash') as any,
+      model: openRouter('openrouter/free') as any,
       system: systemPrompt,
```

---

## 4. Verification and Testing
1. **Unit Tests:** Run `bun test` to verify route handling.
2. **Integration Verification:** Run the application locally or run manual requests to ensure the API route behaves correctly with the new models.
