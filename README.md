# Cadence — Weekly Planner & Semester Roadmap PWA

Cadence is an installable, persistent, notification-capable Progressive Web App (PWA) designed for single-week study & gym schedules as well as multi-week semester roadmaps (such as an 18-week Data Analyst prep plan).

![Cadence Ledger UI](public/icons/icon-512.png)

## 🌟 Key Features

- **AI Plan Parsing**: Paste any unstructured text plan (study or gym+diet), and get an organized weekly schedule.
- **Multi-Week Roadmap Support**: Parses semester roadmaps, breaks them down by phase checkpoints, and provides pagination controls (`◄ Week N of M ►`).
- **Auto-Time Synthesizer**: Automatically schedules evening study blocks when syllabus text lacks explicit daily clock times.
- **Progress & Exception Tracking**:
  - Interactive status stamps on a 7-day strip (**STUDY**, **OFF**, **HOLIDAY +**).
  - Quick-toggle completion or type exact minutes spent (partial or overachievement).
  - Visual Recharts bar chart tracking planned vs. logged minutes per day.
- **PWA Capabilities**: Installable on iOS/Android/Desktop, offline app shell precaching, standalone display mode.
- **Push Reminders**: Web Push notification integration via VAPID keys for upcoming study sessions.
- **Azure Serverless Backend**: Built-in GitHub/Microsoft authentication and Azure Cosmos DB storage integration for cross-device sync.

---

## 🚀 Quick Start (Local Development)

1. **Clone & Install Dependencies**:
   ```bash
   git clone <your-repo-url>
   cd cadence
   npm install
   ```

2. **Add Environment Key**:
   Create a `.env.local` file in the project root:
   ```env
   VITE_GEMINI_API_KEY=your_google_api_key_here
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

---

## 📦 Mobile & PWA Installation

- **Android (Chrome)**: Tap the menu (⋮) → select **Add to Home screen** / **Install app**.
- **iOS (Safari)**: Tap the Share button (⎕↑) → select **Add to Home Screen**.

---

## ☁️ Deployment (Azure Static Web Apps)

1. **Configure Azure Functions API**:
   ```bash
   cd api
   npm install
   ```

2. **Deploy to Azure**:
   ```bash
   npx @azure/static-web-apps-cli deploy ./dist --api-location ./api --env production
   ```
