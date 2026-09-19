# Architecture — Simplotel Grand AI Guest Assistant

## Overview

This application is a full-stack AI-powered hotel guest assistant. It lets guests ask natural-language questions and check room availability through a conversational web interface. The core architectural principle is:

> **The LLM never originates data. It only detects intent and phrases answers from context we inject.**

All factual answers come from a hotel knowledge base (JSON). All availability figures come from a deterministic function. The LLM is only trusted to (a) understand what the guest is asking and (b) phrase a human-readable reply from content we hand it.

---

## System Components

### 1. Frontend — Next.js 15 (App Router)

**Role:** Presentation only. Zero business logic, zero LLM calls, zero API keys.

| Component | Purpose |
|-----------|---------|
| `HeroSection` | Branded header with Simplotel logo and hotel name |
| `QuickStartChips` | Pre-built topic buttons (fed from backend `/api/chat/topics`) |
| `ChatThread` | Scrollable message history |
| `MessageBubble` | Renders guest and assistant turns. Strips markdown from AI output |
| `StatusIndicator` | Animated typing indicator with step-specific text |
| `SourceChip` | Expandable chip showing which KB entry backed each answer |
| `ComposerInput` | Text input + send button, handles Enter key |
| `StayDetailsPanel` | Structured date + guest form for availability checks |
| `RoomResultCard` | Visual card showing room type, capacity, pricing, amenities |
| `useConversation` | React hook encapsulating all chat state and API calls |

**Data flow (frontend):**
```
User types → useConversation.sendMessage()
  → POST /api/chat { sessionId, message }
  → apiClient.ts (fetch wrapper with error handling)
  → Response → add to messages state → ChatThread re-renders
```

**Security:**
- API key never touches the frontend
- `NEXT_PUBLIC_API_BASE_URL` only exposes the backend URL (not secrets)
- All LLM calls are backend-only

---

### 2. Backend — Express.js + TypeScript

**Role:** HTTP server, validation, orchestration, logging.

**Layer structure (dependency direction: top → bottom):**

```
Routes (src/routes/)
  → Controllers (src/controllers/)
      → OrchestratorService (src/services/orchestrator.service.ts)
          → KnowledgeBaseService    (deterministic, keyword scoring)
          → ConversationService     (in-memory session store)
          → AvailabilityService     (deterministic, mock PMS)
          → GeminiProvider          (external, LLM-only)
```

Each layer only knows about the layer directly below it. Controllers don't call LLMs. The orchestrator doesn't know about HTTP.

---

### 3. OrchestratorService — The Brain

This is the most important component. It handles every guest message through a 5-step pipeline:

```
Step 1: Retrieve KB entries
  knowledgeBaseService.search(message)
  → keyword scoring → top 2-3 relevant entries returned

Step 2: Build LLM messages
  conversationService.getHistory(sessionId) → last 10 turns
  → format as LLM message array

Step 3: Call Gemini with function calling enabled
  llmProvider.chat(systemPrompt + KB context, history, [AVAILABILITY_TOOL])
  → Gemini either returns text OR calls checkAvailability()

Step 4a: If tool call → execute deterministically
  availabilityService.check(args) → real availability data
  availabilityService.formatResultSummary() → template the result text
  → LLM never touches the numbers

Step 4b: If text response → classify + attach sources
  classifyResponseType() → answer | clarification | fallback | availability_prompt
  → return with source references from KB entries

Step 5: Fallback on any error
  catch() → createFallback() → front desk contact number
  → never surface raw errors to the guest
```

---

### 4. KnowledgeBaseService — Deterministic KB Search

The hotel knowledge base is a curated JSON file (`hotel-knowledge-base.json`) with ~30 structured entries covering: rooms, policies, dining, amenities, transport, and FAQs.

**Search algorithm (keyword scoring):**
```
For each KB entry:
  score = 0
  For each word in guest message:
    if word appears in entry.topic → score += 3
    if word appears in entry.content → score += 1
    if word is in entry.searchTerms → score += 2
  Return entries with score > 0, sorted descending, top 3
```

This is intentionally simple. The KB is small enough that keyword matching is reliable, fast, and fully transparent — no black box. If the KB has no match (score = 0 for all entries), the orchestrator skips the LLM entirely and returns a fallback pointing to the front desk.

---

### 5. AvailabilityService — Deterministic Mock PMS

Simulates a Property Management System with realistic logic:

| Rule | Implementation |
|------|---------------|
| **Blackout dates** | Dec 24–26 (Christmas), Dec 31–Jan 2 (New Year) → `available: false` |
| **Capacity filtering** | Only rooms where `capacity >= adults + children` are returned |
| **Seasonal pricing** | Peak (Oct–Nov, Jan–Feb, Apr): ×1.2 | Monsoon (Jul–Sep): ×0.85 | Default: ×1.0 |
| **Overage (>4 guests)** | Returns friendly message suggesting multiple rooms |
| **Validation** | Past dates, checkout before checkin, >10 adults — all rejected with field-level errors |

---

### 6. GeminiProvider — LLM Adapter

Wraps `@google/generative-ai` SDK. Implements the `LLMProvider` interface so the LLM is swappable (OpenAI, Anthropic, etc.) without touching orchestration logic.

**What it does:**
- Configures the model with the system prompt
- Sends conversation history + available tools
- Returns either `{ text }` (prose response) or `{ toolCall: { name, args } }` (function call)
- Any SDK error propagates up to the orchestrator's catch block → graceful fallback

**Model:** `gemini-2.5-flash-preview` (fast, cost-effective, function calling support)

---

### 7. ConversationService — Session Store

In-memory `Map<sessionId, Message[]>`. Each session stores the conversation history used to give the LLM context for follow-up questions.

**Limitations (known, acceptable for this scope):**
- Lost on server restart
- No TTL / eviction (memory grows unbounded in long-running prod)
- Single instance only (no horizontal scaling)

**Production path:** Replace with Redis or PostgreSQL with a TTL.

---

## Data Flow — End-to-End Example

**Guest asks: "Do you have rooms for October 12-14 for 2 adults?"**

```
1. Browser → POST /api/chat { sessionId, message }

2. ChatController.handleChat()
   → validates request (Zod)
   → calls orchestratorService.handleMessage()

3. OrchestratorService
   → KB search("rooms october 2 adults") → rooms entry matches
   → builds LLM messages with last 10 turns
   → calls Gemini with AVAILABILITY_TOOL definition

4. Gemini detects intent → returns toolCall:
   { name: "checkAvailability", args: { checkIn: "2026-10-12", checkOut: "2026-10-14", adults: 2 } }

5. OrchestratorService.handleAvailabilityToolCall()
   → availabilityService.check({ checkIn, checkOut, adults: 2 })
   → October = peak season → prices multiplied by 1.2
   → capacity filter: all 4 room types fit 2 adults
   → formatResultSummary() → text built from code template, not LLM

6. Return:
   { type: "availability_result", reply: { text, toolCall: { result: { rooms, available, nights } } } }

7. Frontend
   → ChatThread renders message bubble (text)
   → MessageBubble detects type=availability_result → renders RoomResultCard for each room
```

---

## Anti-Hallucination Strategy

| Mechanism | How it works |
|-----------|-------------|
| **Context-restricted prompting** | Only 2-3 KB entries injected per turn. Model never sees the full KB or its own general knowledge |
| **Explicit prohibition** | System prompt: "NEVER invent, guess, or fabricate any information" |
| **Zero-match fallback** | If KB returns nothing, the LLM is not called at all. We return a canned response |
| **Template-based tool results** | Availability numbers are code-inserted, never LLM-generated |
| **Markdown stripping** | Frontend strips all `**bold**` and `*italic*` markdown from responses |
| **Visible grounding** | Source chips on each answer show which KB entry backed it — auditable by guests and QA |

---

## Error Handling Strategy

| Failure Point | Handler | Guest Experience |
|--------------|---------|-----------------|
| Invalid request body | Zod validation → 400 + field errors | Form shows inline errors |
| KB returns no match | Orchestrator short-circuits, no LLM call | "I don't have info on that. Call +91-22-6789-0000" |
| Gemini API error/timeout | `catch()` → `createFallback()` | Error bubble + retry button |
| Availability params invalid | Field-level errors in response | Listed corrections requested in chat |
| Frontend network failure | `apiClient` catch → `useConversation` error state | Error bubble, composer preserved |
| Backend down | Frontend health check fails | Offline banner, input disabled |

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js 15 | Industry standard, SSR + App Router, preferred by assignment |
| Backend framework | Express.js | Minimal, widely understood, fast to set up |
| LLM provider | Google Gemini | Native function calling, free tier, fast flash model |
| KB format | JSON file | Simple for this scope; no DB overhead; easy to swap later |
| KB search | Keyword scoring | KB is <50 entries; vector search overkill, adds complexity and latency |
| Testing | Vitest + Supertest | Vitest is fast and TS-native; Supertest for real HTTP layer tests |
| Validation | Zod | Type-safe, composable, integrates with TypeScript inference |
| Styling | Tailwind CSS + Simplotel brand colors | Utility-first, rapid iteration, exact brand match (`#F1592A`, `#152039`) |
