# Simplotel Grand — AI-Powered Hotel Guest Assistant

A full-stack, AI-powered guest assistant for **Simplotel Grand Hotel & Spa**, a luxury 5-star property in Mumbai. Guests can ask natural-language questions about the property and check room availability through a conversational web interface — without ever leaving the hotel website.

---

## Architecture Overview

```
┌─────────────────────────────┐
│   Frontend  (Next.js 15)    │  Presentation only — no LLM calls, no API keys
└────────────┬────────────────┘
             │ HTTP JSON (REST)
┌────────────▼────────────────┐
│  Backend  (Express + TS)    │  Controllers handle HTTP concerns only
└────────────┬────────────────┘
             │
┌────────────▼────────────────┐
│   OrchestratorService       │  Routes intent → KB / Tool / LLM
└──┬──────────────┬───────────┘
   │              │
┌──▼──────────┐  ┌▼──────────────────────┐
│ KB Service  │  │ Availability Service   │  checkAvailability() — fully deterministic
│ (keyword    │  │ (mock PMS, seasonal    │
│  scoring)   │  │  pricing, blackouts)   │
└──┬──────────┘  └───────────────────────┘
   │
┌──▼──────────────────┐   ┌──────────────────────┐
│ hotel-knowledge-    │   │  Gemini LLM Provider  │  Intent + phrasing only
│ base.json           │   │  (gemini-flash)       │
└─────────────────────┘   └──────────────────────┘
```

**Key design rule:** The LLM never originates data. It only detects intent and phrases answers from KB context injected into the prompt. All prices, policies, and availability are served deterministically.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, Zod validation |
| AI / LLM | Google Gemini (gemini-2.5-flash-preview) via `@google/generative-ai` |
| Testing | Vitest, Supertest |
| Font / Design | Poppins, Simplotel brand palette (`#F1592A`, `#152039`) |

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- **Google Gemini API Key** — [Get one free at Google AI Studio](https://aistudio.google.com/apikey)

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd hotel-guest-assistant
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Open `.env` and set your Gemini API key:

```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

Backend runs on **http://localhost:3001**

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create the environment file:

```bash
cp .env.local.example .env.local
```

The default `.env.local` is:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on **http://localhost:3000**

Open your browser at [http://localhost:3000](http://localhost:3000).

---

## API Reference

### POST /api/chat — Send a guest message

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo-1","message":"What time is check-in?"}'
```

**Response:**
```json
{
  "sessionId": "demo-1",
  "type": "answer",
  "reply": {
    "text": "Check-in time at Simplotel Grand Hotel & Spa is 2:00 PM. Early check-in is subject to availability and may incur an additional charge.",
    "sources": [
      { "topic": "Check-in Policy", "snippet": "Standard check-in time is 2:00 PM..." }
    ]
  }
}
```

**Response types:** `answer` | `availability_result` | `availability_prompt` | `clarification` | `fallback`

---

### POST /api/availability — Check room availability directly

```bash
curl -X POST http://localhost:3001/api/availability \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo-1",
    "checkIn": "2026-10-12",
    "checkOut": "2026-10-14",
    "adults": 2,
    "children": 0
  }'
```

**Response:**
```json
{
  "available": true,
  "rooms": [
    {
      "roomType": "Deluxe Room",
      "capacity": 2,
      "pricePerNight": 10200,
      "totalPrice": 20400,
      "currency": "INR",
      "amenities": ["Free Wi-Fi", "55\" Smart TV", "Mini Bar", "City View"]
    },
    {
      "roomType": "Premium Suite",
      "capacity": 3,
      "pricePerNight": 17400,
      "totalPrice": 34800,
      "currency": "INR",
      "amenities": ["Free Wi-Fi", "Sea-Facing Balcony", "Jacuzzi", "Butler Service"]
    }
  ],
  "message": "Great news! We have 4 room types available for Oct 12 – Oct 14 (2 nights)...",
  "nights": 2,
  "checkIn": "2026-10-12",
  "checkOut": "2026-10-14",
  "guests": { "adults": 2, "children": 0 }
}
```

---

### GET /api/health — Backend health check

```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{ "status": "ok", "timestamp": "2026-09-19T07:00:00.000Z", "version": "1.0.0" }
```

---

### GET /api/chat/topics — Quick-start topic chips (for frontend)

```bash
curl http://localhost:3001/api/chat/topics
```

**Response:**
```json
{
  "topics": [
    "Check-in & Check-out times",
    "Room types & pricing",
    "Breakfast & dining",
    "Swimming pool & spa",
    "Cancellation policy",
    "Airport transfer",
    "Check room availability"
  ],
  "hotelName": "Simplotel Grand Hotel & Spa"
}
```

---

## Running Tests

```bash
cd backend
npm test
```

**42 tests across 5 test files — all passing:**

| File | What's Tested | Tests |
|------|--------------|-------|
| `knowledgeBase.service.test.ts` | KB search relevance, topic listing, edge cases | 10 |
| `availability.service.test.ts` | Pricing, capacity, blackouts, validation | 12 |
| `orchestrator.service.test.ts` | Full flow with mocked LLM, tool calling, fallback | 8 |
| `chat.routes.test.ts` | HTTP integration — valid/invalid requests, E2E | 7 |
| `availability.routes.test.ts` | Availability HTTP integration | 5 |

```bash
# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Project Structure

```
Hotel Guest Assistant/
├── README.md               ← This file
├── ARCHITECTURE.md         ← Deep-dive: data flow, components, design decisions
├── DECISIONS.md            ← Product, UX, engineering & AI decisions
├── EVALUATION.md           ← 42 automated + 10 manual test scenarios
│
├── backend/
│   ├── src/
│   │   ├── config/         ← Validated env config (Zod)
│   │   ├── controllers/    ← HTTP glue: chat, availability, health
│   │   ├── services/       ← Business logic: orchestrator, KB, availability, conversation
│   │   ├── providers/      ← External adapters: Gemini LLM, provider factory
│   │   ├── data/           ← hotel-knowledge-base.json + repository
│   │   ├── middleware/      ← Error handling, request logging, validation
│   │   ├── routes/         ← Express route definitions
│   │   └── types/          ← TypeScript interfaces
│   └── tests/
│       ├── unit/           ← Service-level unit tests (Vitest)
│       └── integration/    ← HTTP route tests (Supertest + Vitest)
│
└── frontend/
    ├── app/                ← Next.js App Router (layout, page, globals.css)
    ├── components/
    │   ├── chat/           ← ChatThread, MessageBubble, ComposerInput, StatusIndicator, SourceChip
    │   ├── availability/   ← StayDetailsPanel, DateGuestForm, RoomResultCard
    │   └── layout/         ← HeroSection, QuickStartChips
    └── lib/                ← API client, types, useConversation hook
```

---

## AI Tools Used During Development

| Tool | Purpose |
|------|---------|
| **Google Gemini (gemini-2.5-flash-preview)** | Production LLM powering the guest assistant |
| **Antigravity (AI coding assistant)** | Code generation, architecture design, debugging assistance |

---

## License

This project is submitted as an assignment assessment for Simplotel.
