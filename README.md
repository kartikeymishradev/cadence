# Dintaal — Life Rhythm & Weekly Planner PWA

> **"the beat of your day"** — Less AI, More Awareness. Transparent, data-driven planning with no fabricated scores, no gamification, no motivational fluff.

Dintaal is an installable Progressive Web App (PWA) built for students, engineers, and self-directed learners who want honest, objective visibility into how they actually spend their time.

---

## ✨ Core Features & System Architecture

### 🧭 Navigation & Core Structure
- **Today-First Navigation** — 6 core views: `Today` (daily rhythm & execution), `Week` (weekly schedule & heatmap), `Goals & Habits` (Semester goals & progress), `Notes` (Knowledge Vault), `Focus` (Pomodoro & ambient audio), and `Setup` (Category & Subject Configuration).
- **4 Life Categories**:
  1. 📚 **College / Academics**
  2. 🚀 **Career & Skills**
  3. 💪 **Health & Body**
  4. 🌱 **Personal Growth**

---

### ⏳ Stage A — Deadline Awareness
- **Deadline Strip** — persistent banner on Today view displaying your next exam or milestone with exact days remaining (e.g. *"📚 DAA Mid Sem — 6 days left"*). Single source of truth: configured once in Setup, rendered across views.
- **Time Reality Card** — Planned vs. Actual focus hours derived directly from `duration` and `actualMinutes` in task statuses. Zero padding, zero estimation.
- **End-of-Day Summary Card** — surfaces after 8 PM showing completed tasks, focus hours logged, and an objective summary of the day.

---

### 📚 Stage B — Subject Registry & Per-Subject Tracking
- **Master Subject Registry** — editable per-category list of subjects (seeded with subjects like *Big Data Technologies*, *Financial Co-relations*, *Introduction to Fintech*, *Introduction to IoT*, *Design & Analysis of Algorithm*, *Constitution of India*).
- **Strict 3-Level Parser Matcher**:
  1. Exact subject name match
  2. Known abbreviation match (DAA, IoT, COI, SQL)
  3. Leaves `subjectId: null` rather than guessing silently
- **Subject Heatmap** — per-subject activity heatmap in Week view displaying study frequency.
- **Neutral "Not Studied" Nudge** — surfaces subjects untouched for 3+ days without guilt framing or gamification.

---

### 📊 Stage C — Transparent Rhythm Score & Weekly Reflection
- **Daily Rhythm Score (0–100)** — four transparent, 25-point non-overlapping components:
  - 🌙 **Sleep Rhythm (25 pts)** — awarded if a sleep schedule log exists for today (`sleepLogs[todayKey].sleptOnSchedule`).
  - ⚡ **Focus Hours (25 pts)** — pro-rated linearly based on actual focus minutes vs 180 min target (`Math.min(25, Math.round((totalActualMins / 180) * 25))`).
  - ✅ **Task Completion (25 pts)** — pro-rated based on task completion percentage (`Math.round(progressPct * 0.25)`, where completed task = 1.0, partial task = 0.5).
  - 🔥 **Consistency (25 pts)** — 25 pts if any activity was logged today (`completedTasks > 0 || partialTasks > 0 || totalActualMins > 0`).
- **Rest Day Handling** — Rhythm Score is marked as `Rest Day` (hidden) on days marked Off or Holiday.
- **Transparent Math Breakdown** — tap "Explain Math" to expand the exact mathematical formula behind every point.
- **Weekly Reflection Journal** — 3 structured end-of-week reflection questions saved locally.

---

### 🎓 Stage D — Semester Journey & Subject Dashboard
- **Semester Journey Timeline** — visual progress bar from semester start → end date with current week highlighted.
- **Subject Dashboard Modal** — click any subject in the registry to inspect total logged hours, last studied date, tasks this week, and next exam deadline (linked directly to Stage A single-source exam dates).

---

### 📝 Notes & Knowledge Vault
- **Custom Notes Management** — create and organize notes via primary **`+ Add Note`** button and modal with title, category, tags, and content.
- **`📅 Convert to Event`** — convert any note directly into a scheduled timetable task event with pre-filled title, day, time, and duration.
- **Export & Search** — filter notes by category/tags, search content, or export all notes in clean plain text.

---

### 🎵 Focus Timer & Ambient Audio Player
- **Pomodoro Focus Timer** — custom focus session timer with logged focus minutes persisting to `focusLogs`.
- **Ambient Noise Audio Player** — integrated audio engine supporting user-sourced MP3 tracks:
  - 🟤 `brown_noise.mp3` (Deep Brown Noise)
  - ⚪ `white_noise.mp3` (White Noise)
  - 🧠 `gamma_wave.mp3` (40Hz Gamma Focus Tone)

---

### 🤖 Dintaal AI Copilot (2-Tier Architecture)

Dintaal Copilot operates on a **2-Tier Architecture**:
1. **Deterministic Local Intent Routing**: Processes structured commands locally for maximum safety and immediate feedback.
2. **Vercel Serverless LLM Fallback**: Routes open-ended Q&A queries to Groq Llama 3.3 / Gemini 2.0 Flash via serverless endpoints (`/api/copilot`).

#### **Active Copilot Features**:

| Feature | Type | Confirmation Required | Description |
|---|---|---|---|
| **1. Smart Schedule Rescheduler** | Mutation | `[ ✓ Apply ]` Proposal Card | Reschedules class/study slot time and day. |
| **2. Mark Task Done / Partial** | Mutation | `[ ✓ Apply ]` Proposal Card | Updates task status with multi-task candidate card ambiguity handling. |
| **3. Set / Edit Exam Date** | Mutation | `[ ✓ Apply ]` Proposal Card | Updates Stage A subject exam dates in Setup. |
| **4. Add Note & Event Reminder** | Mutation | `[ ✓ Confirm & Save Note Event ]` Card | Saves note to Notes Vault and schedules time / browser notification reminder. |
| **5. Workload Friction Audit** | Read-Only | None | Analyzes focus logs vs completion rates. Enforces strict 3+ log minimum sample size guardrail. |
| **6. Exam Readiness Report** | Read-Only | None | Aggregates exam dates, subject logs, and dashboard metrics into a readiness % report. |
| **7. Notes Vault Q&A & Search** | Read-Only | None | Answers questions and generates summaries from custom and task notes. |
| **8. Daily Sleep Check-in** | Mutation | Instant | Logs daily sleep schedule (+25 pts on Rhythm Score). |

*Strict Safety Rule*: Zero silent mutations. All schedule and setup edits generate a Proposal Card requiring explicit user click on **`[ ✓ Apply ]`**.

---

## 📅 Multi-Week Plan Architecture

- `multiWeekPlan[catId]` stores the complete N-week roadmap (`weeks: [...]`).
- `schedule[catId]` holds ONLY the currently active week's task schedule.
- `currentWeekIndex` is manually controlled via `< Prev Week` / `Next Week >` controls.
- `syncMultiWeekTasks` propagates edits and deletions across all weeks cleanly.
- Re-parsing a plan generates fresh task IDs, resetting task checkmarks (`taskStatuses`), while Pomodoro focus timer hours (`focusLogs`) remain 100% safe.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 8 |
| **Styling** | Vanilla CSS (CSS custom properties, dark/paper themes) |
| **State & Hooks** | React `useState`, `useCallback`, `useRef`, custom `usePersistence` |
| **Database & Auth** | Supabase Auth + RLS-Protected Cloud Sync |
| **AI Infrastructure** | Groq API (`llama-3.3-70b`) with Gemini 2.0 Flash fallback via Vercel Serverless Function `/api/copilot` |
| **Audio Engine** | HTML5 Audio API with user-sourced ambient MP3s |
| **PWA & Notifications** | Vite PWA Plugin (Workbox SW) + Web Push API |
| **Deployment** | Vercel |

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

AI API keys (`GROQ_API_KEY`, `GEMINI_API_KEY`) are managed strictly on Vercel serverless functions — **zero client-side API key exposure**.

---

## 🧭 Design Philosophy

- **No Fabricated Scores** — every metric and score is computed strictly from empirical user logs.
- **No Gamification** — no XP, no coins, no badges, no fake streaks.
- **No Motivational Fluff** — data is presented objectively and transparently.
- **Strict User Consent** — Copilot mutation commands require explicit user click on Proposal Cards.
