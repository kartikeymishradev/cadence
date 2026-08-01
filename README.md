# Dintaal — Weekly Planner & Life Rhythm PWA

> **"Less AI, More Awareness"** — Transparent, data-driven planning with no fabricated scores, no gamification, no motivational fluff.

Dintaal is an installable Progressive Web App (PWA) built for students and self-directed learners who want honest visibility into how they actually spend their time — not a dopamine loop.

---

## ✨ Features

### Stage A — Deadline Awareness
- **Deadline Strip** — a persistent banner on Today view showing your next exam or milestone with exact days remaining (e.g. *"📚 Big Data Technologies Mid Sem — 6 days left"*). Single source of truth: set once in Setup, shows everywhere.
- **Time Reality Card** — Planned vs. Actual hours for the day, derived directly from `duration` and `actualMinutes` in task statuses. No estimation, no padding.
- **End-of-Day Summary Card** — appears after 8 PM; shows tasks completed, hours logged, and a plain honest line about the day.

### Stage B — Subject Registry & Per-Subject Tracking
- **Master Subject Registry** — editable per-category list of subjects (seeded with College subjects: Big Data Technologies, Financial Co-relations, Introduction to Fintech, Introduction to IoT, Design & Analysis of Algorithm, Constitution of India).
- **Strict Parser Matching** — when a plan is parsed, task titles are matched against the registry using a 3-level tiebreak: (1) exact subject name match → (2) known abbreviations (DAA, IoT, COI) → (3) leave `subjectId: null` rather than guess.
- **Auto-Migration** — on load, existing tasks without a `subjectId` are re-matched against the registry using the same logic; no silent data loss.
- **Subject Heatmap** — per-subject activity heatmap visible in the Week view, showing study frequency across the week.
- **Neutral "Not Studied" Nudge** — surfaces subjects untouched for 3+ days; no guilt framing, just a factual prompt.

### Stage C — Transparent Rhythm Score & Weekly Reflection
- **Rhythm Score (0–100)** — four distinct, non-overlapping components:
  - 🌙 Sleep Logged (25 pts) — did you enter a sleep window?
  - ⚡ Focus Hours (25 pts) — actual minutes logged vs 3-hour baseline
  - ✅ Task Completion (25 pts) — weighted task completion rate
  - 🔥 Consistency (25 pts) — active visit streak
- **Rest Day Handling** — score is hidden (not shown as 0%) on days marked Off or Holiday.
- **Score Breakdown Card** — tap to expand and see the exact formula behind each point.
- **Weekly Reflection Journal** — three fixed text questions per week (stored locally):
  1. What went well this week?
  2. What was your main distraction?
  3. What is your primary focus for next week?

### Stage D — Semester Journey & Subject Dashboard
- **Semester Journey Timeline** — visual progress bar from semester start → end, with current week highlighted. Dates configured once in Setup.
- **Subject Dashboard Modal** — click any subject in the registry to see: total logged hours, last studied date, tasks this week, next exam deadline. **Fully linked to Stage A deadline data** — no duplicate data entry.
- **Single-Source Exam Dates** — exam dates entered in Setup (Stage A) flow directly into the Subject Dashboard. No drift possible.

### Stage E — Life Rhythm Category Reframe
- **4th Category: Personal Growth** — alongside College, Career & Skills, and Health & Body. Clean empty state on heatmap when no tasks are scheduled.
- **3-Level Parser Tiebreak** — for ambiguous task titles matching multiple category aliases:
  1. Technical/domain-specific terms win (algorithms, SQL, IoT, coding)
  2. Subject registry match
  3. Category alias fallback
- **No silent guessing** — unresolved matches surface for manual tagging.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 8 |
| Styling | Vanilla CSS (CSS custom properties, dark/paper themes) |
| State | React `useState` + `useCallback` + `useRef` |
| Persistence | `localStorage` (per-week) + Supabase cloud sync |
| Auth | Supabase Auth (email/OAuth) |
| AI Parsing | Groq API (llama-3.3-70b) with Gemini 2.0 Flash fallback |
| Charts | Recharts |
| PWA | Vite PWA plugin (Workbox, `generateSW`) |
| Push Notifications | Web Push (VAPID) via Vercel serverless function |
| Deployment | Vercel |

---

## 🚀 Quick Start (Local Dev)

```bash
git clone https://github.com/kartikeymishradev/cadence.git
cd cadence
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Environment Variables

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

The Groq/Gemini API keys are handled server-side via Vercel environment variables — no client-side key exposure.

---

## 📦 PWA Installation

| Platform | Steps |
|---|---|
| Android (Chrome) | Menu (⋮) → **Add to Home screen** / **Install app** |
| iOS (Safari) | Share button (⎕↑) → **Add to Home Screen** |
| Desktop (Chrome/Edge) | Address bar install icon → **Install** |

---

## ☁️ Deploy to Vercel

```bash
npm run build
vercel --prod
```

Set these in Vercel project settings → Environment Variables:
- `GROQ_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

---

## 🧭 Design Philosophy

- **No fabricated scores** — every number shown is derived from actual logged data.
- **No gamification** — no XP, no coins, no badges, no streaks presented as rewards.
- **No motivational quotes** — the app does not tell you how to feel about your data.
- **Honest empty states** — if no data exists, the UI says so plainly rather than hiding the section or showing a placeholder.
- **Single source of truth** — exam dates, subject lists, semester config are entered once and reused everywhere. No parallel data paths.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── TodayView.jsx          # Main today view (Stages A, B, C)
│   ├── WeekStrip.jsx          # Week heatmap + reflection journal
│   ├── SubjectDashboardModal.jsx  # Per-subject stats (Stage D)
│   ├── PlanInput.jsx          # Plan input + semester config (Stage D)
│   └── ...
├── hooks/
│   ├── usePersistence.js      # All persisted state (localStorage + Supabase)
│   └── ...
├── services/
│   ├── parser.js              # Groq/Gemini plan parser + tiebreak logic
│   ├── storage.js             # localStorage read/write
│   └── cloudSync.js           # Supabase cloud sync
└── utils/
    ├── constants.js           # Shared constants, color tokens
    └── dateUtils.js           # Date helpers
```

---

*Built by [@kartikeymishradev](https://github.com/kartikeymishradev)*
