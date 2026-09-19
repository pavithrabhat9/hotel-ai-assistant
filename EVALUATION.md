# Evaluation & Test Scenarios

This document covers all test scenarios for the Simplotel Grand AI Guest Assistant — both automated backend tests and manual frontend test cases.

---

## Automated Backend Tests

**42 tests across 5 files — all passing (`npm test` in `/backend`)**

### Unit Tests — Knowledge Base Service (`knowledgeBase.service.test.ts`)

| # | Category | Input | Expected | Status |
|---|----------|-------|----------|--------|
| 1 | Normal question | `"What time is check-in?"` | Returns entries matching check-in policy, contains "2:00 PM" | ✅ PASS |
| 2 | Normal question | `"Is breakfast included?"` | Returns breakfast/dining entry, mentions "included" | ✅ PASS |
| 3 | Normal question | `"What is the cancellation policy?"` | Returns cancellation entry with "48 hours" | ✅ PASS |
| 4 | Normal question | `"swimming pool"` | Returns pool/spa entry with pool information | ✅ PASS |
| 5 | Room query | `"Which room is suitable for three guests?"` | Returns room-type entries mentioning capacity ≥ 3 | ✅ PASS |
| 6 | Room query | `"room for a big family"` | Returns entries mentioning Family Room | ✅ PASS |
| 7 | Out of scope (FAQ) | `"Do you have a casino?"` | Returns FAQ entry: "does not have a casino" | ✅ PASS |
| 8 | Off-topic | `"What is the meaning of life?"` | Returns ≤ 3 low-relevance results (or empty) | ✅ PASS |
| 9 | Topics endpoint | `getTopics()` | Returns array of 7 topic strings + hotel name | ✅ PASS |
| 10 | Edge case | Empty string query | Returns empty results without throwing | ✅ PASS |

---

### Unit Tests — Availability Service (`availability.service.test.ts`)

| # | Category | Input | Expected | Status |
|---|----------|-------|----------|--------|
| 11 | Happy path | checkIn: 2026-10-12, checkOut: 2026-10-14, adults: 2 | `available: true`, 4 room types returned, nights: 2 | ✅ PASS |
| 12 | Capacity filter | adults: 3, children: 1 (total 4) | Only rooms with capacity ≥ 4 returned | ✅ PASS |
| 13 | Blackout — Christmas | checkIn: 2026-12-24, checkOut: 2026-12-26 | `available: false`, "fully booked" message | ✅ PASS |
| 14 | Blackout — New Year | checkIn: 2026-12-31, checkOut: 2027-01-02 | `available: false` | ✅ PASS |
| 15 | Capacity exceeded | adults: 6 (max room is 4) | "multiple rooms" suggestion, `available: false` | ✅ PASS |
| 16 | Seasonal pricing — peak | checkIn: 2026-10-12 | Deluxe pricePerNight: ₹10,200 (₹8,500 × 1.2) | ✅ PASS |
| 17 | Seasonal pricing — monsoon | checkIn: 2026-07-10 | Deluxe pricePerNight: ₹7,225 (₹8,500 × 0.85) | ✅ PASS |
| 18 | Validation — missing fields | Empty body `{}` | Field errors for checkIn, checkOut, adults | ✅ PASS |
| 19 | Validation — reversed dates | checkIn: Oct 14, checkOut: Oct 12 | Field error on checkOut: "must be after check-in" | ✅ PASS |
| 20 | Validation — past dates | checkIn: 2020-01-01 | Field error on checkIn: "cannot be in the past" | ✅ PASS |
| 21 | Validation — group too large | adults: 15 | Field error on adults: exceeds maximum | ✅ PASS |
| 22 | Validation — valid passes | Complete valid request | No errors, full availability response | ✅ PASS |

---

### Unit Tests — Orchestrator Service (`orchestrator.service.test.ts`)

| # | Category | Scenario | Expected | Status |
|---|----------|----------|----------|--------|
| 23 | LLM failure | Gemini API throws error (mocked) | `type: "fallback"`, friendly message, front desk contact number | ✅ PASS |
| 24 | LLM failure | Consecutive failures — two messages | Both return fallback, server does not crash | ✅ PASS |
| 25 | Tool call — happy path | LLM returns `checkAvailability` tool call with valid args | Deterministic result with room data, prices correct | ✅ PASS |
| 26 | Tool call — blackout | LLM triggers tool call with Christmas dates | `available: false` in tool result | ✅ PASS |
| 27 | Conversation context | Follow-up question after first answer | Session history passed to LLM, context maintained | ✅ PASS |
| 28 | Missing availability info | LLM asked about availability but no dates provided | `type: "availability_prompt"`, clarification message | ✅ PASS |
| 29 | Fallback — no KB match | Message with zero keyword matches | Skips LLM entirely, returns fallback | ✅ PASS |
| 30 | Source attribution | Normal KB answer | `sources` array contains matched KB topic names | ✅ PASS |

---

### Integration Tests — Chat Routes (`chat.routes.test.ts`)

| # | Category | Request | Expected | Status |
|---|----------|---------|----------|--------|
| 31 | Health check | `GET /api/health` | 200, `{ status: "ok" }` | ✅ PASS |
| 32 | Empty body | `POST /api/chat {}` | 400, field-level validation errors | ✅ PASS |
| 33 | Message too long | POST with 2001-char message | 400, message field error | ✅ PASS |
| 34 | Normal E2E | `POST /api/chat { sessionId, message }` (LLM mocked) | 200, `{ type, reply: { text, sources } }` | ✅ PASS |
| 35 | LLM failure E2E | LLM throws (mocked) | 200 with `type: "fallback"` — never 500 to client | ✅ PASS |
| 36 | Topics endpoint | `GET /api/chat/topics` | 200, `{ topics: [...], hotelName: "..." }` | ✅ PASS |
| 37 | 404 handling | `GET /api/nonexistent` | 404, structured `{ error, code }` response | ✅ PASS |

---

### Integration Tests — Availability Routes (`availability.routes.test.ts`)

| # | Category | Request | Expected | Status |
|---|----------|---------|----------|--------|
| 38 | Valid availability | Complete valid form submission | 200, room list with prices, nights, dates | ✅ PASS |
| 39 | Missing fields | POST without checkIn | 400, field errors | ✅ PASS |
| 40 | Blackout dates | Christmas dates | 200, `available: false` | ✅ PASS |
| 41 | Capacity too large | adults: 6 | 200, message suggesting multiple rooms | ✅ PASS |
| 42 | Invalid date format | checkIn: "not-a-date" | 400, format validation error | ✅ PASS |

---

## Manual Frontend Test Checklist

These tests should be performed with both backend and frontend running locally.

| # | Scenario | Steps | Expected Outcome |
|---|----------|-------|-----------------|
| F1 | **Loading state** | Type any message and press Send | Animated dots appear with step-specific text ("Looking that up…" or "Checking room details…") |
| F2 | **Error state** | Stop the backend server, send a message | Red error bubble appears in chat with a Retry button. Composer message is preserved. |
| F3 | **Service offline banner** | Load page with backend not running | Yellow offline banner at top. Chat input is disabled with "Service unavailable…" placeholder. |
| F4 | **Retry button** | After error, click Retry | Re-sends the last guest message. If backend is back up, gets a successful response. |
| F5 | **Quick-start chips** | Click any chip (e.g., "Breakfast & dining") | Message is automatically sent and answered. Chips remain visible throughout the session. |
| F6 | **Stay Details Panel — happy path** | Fill in valid dates (e.g., Oct 12-14), adults: 2, click Check Availability | Room cards appear in the chat thread with pricing, capacity, and amenities. Panel shows "Results sent to chat" confirmation. |
| F7 | **Stay Details Panel — validation** | Leave check-in date empty, click Check Availability | Inline field error appears below the date input. No network request is made. |
| F8 | **New conversation** | Click the + button in the chat header | All messages are cleared, a new session ID is created. Chips are still visible. |
| F9 | **Responsive — mobile** | Resize browser to < 1024px width | Side panel hides. A calendar icon button appears in the chat header to toggle it. |
| F10 | **Source chips** | Click the expand button on a source chip under any KB-backed answer | The chip expands to show a snippet of the KB entry that backed the answer. |

---

## End-to-End Flow Walkthrough

This is the primary happy-path flow. Run this to validate the complete frontend-to-backend integration.

**Step 1 — Open the app**
- Navigate to http://localhost:3000
- Expected: Hero section loads with Simplotel logo, hotel name in uppercase, quick-start chips visible inside the chat panel

**Step 2 — Click a chip: "Breakfast & dining"**
- Expected: Message sent automatically, assistant responds with breakfast policy, source chip showing the KB entry appears

**Step 3 — Follow-up question: "What about the pool?"**
- Expected: Responds with pool/spa information. Uses the previous conversation context (no need to repeat context)

**Step 4 — Availability via natural language: "Do you have rooms for October 12-14 for 2 adults?"**
- Expected: LLM calls `checkAvailability` tool, room cards rendered with peak-season pricing (×1.2), 4 room types shown

**Step 5 — Same dates via Stay Details Panel**
- Expected: Identical room results appear in chat thread. Panel shows "Results sent to chat" confirmation.

**Step 6 — Blackout date test: Enter Dec 24-26 in panel**
- Expected: "Fully booked" message appears in chat. No room cards rendered.

**Step 7 — Simulate backend failure**
- Stop the backend process (`Ctrl+C` in the backend terminal)
- Send any message from the frontend
- Expected: Red error bubble with Retry button. Composer still has the typed message.

**Step 8 — Recovery**
- Restart the backend (`npm run dev`)
- Click Retry
- Expected: Successful response. Full chat history still visible.

---

## Observed Results Summary

All 42 automated tests pass. All 10 manual frontend scenarios produce the expected results. The end-to-end flow completes successfully in under 3 seconds for typical responses.

The most important validated property: **when the LLM fails (rate limit, timeout, or error), the guest always receives a graceful fallback with the front desk contact number — never a raw error or a 500 response.**
