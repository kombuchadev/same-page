# Same Page

A real-time multiplayer mobile party game built with **Expo (React Native)** and **Firebase Realtime Database**.

Players join a room, answer the same prompt, and score points when their answers match someone else's. The closer everyone thinks alike, the higher you score.

---

## How the Game Works

1. A host creates a room and gets a **4-digit code**
2. Friends join using that code
3. Each round, everyone sees the same prompt and has a limited time to type their answer (answers are hidden from other players while submitting)
4. When time is up, answers are revealed and **clustered by similarity** — matching answers score a point each
5. The game runs for **5 rounds**; the player with the most points wins

**Scoring:** Fuzzy matching (Levenshtein distance) groups similar answers together, so "Movie" and "movie" count as the same answer.

---

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Framework    | Expo SDK 54 + Expo Router (file-based routing)      |
| Language     | TypeScript                                          |
| Backend / DB | Firebase Realtime Database (Spark free plan)        |
| Auth         | Firebase Anonymous Auth (per-tab session isolation) |
| State        | React Context + custom `useFirebaseGame` hook       |
| Scoring      | Host-side (no Cloud Functions needed)               |

---

## Project Structure

```
same-page/
├── app/
│   ├── index.tsx              # Splash screen (auto-navigates to /home)
│   ├── home.tsx               # Nickname entry + create/join room
│   ├── create.tsx             # Room settings (pack + timer selection)
│   ├── lobby/[roomCode].tsx   # Waiting lobby with live player list
│   ├── game/[roomCode].tsx    # Guessing screen with countdown timer
│   ├── reveal/[roomCode].tsx  # Answer reveal + scoring
│   └── results/[roomCode].tsx # Final leaderboard
├── src/
│   ├── context/GameContext.tsx        # Shared game state across all screens
│   ├── data/packs.ts                  # Question packs (local, no DB read needed)
│   ├── hooks/
│   │   ├── useFirebaseGame.ts         # Core Firebase logic & game actions
│   │   └── useTimer.ts                # Server-offset-corrected countdown timer
│   ├── lib/
│   │   └── scoringEngine.ts           # Fuzzy matching + cluster scoring
│   ├── components/
│   │   ├── PlayerList.tsx
│   │   ├── TimerDisplay.tsx
│   │   └── ScoreBoard.tsx
│   └── types/game.ts                  # TypeScript interfaces
├── firebase/
│   └── database.rules.json            # Firebase security rules
└── firebaseConfig.ts                  # Firebase init + anonymous auth
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- [Expo Go](https://expo.dev/go) app on your phone **or** an Android/iOS simulator
- A Firebase project (see Firebase Setup below)

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/kombuchadev/same-page.git
cd same-page
```

### 2. Install dependencies

```bash
npm install
```

### 3. Firebase Setup

This app requires a Firebase project with **Realtime Database** and **Anonymous Authentication** enabled.

#### Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → follow the prompts
3. In the left sidebar, go to **Build → Realtime Database** → Create database → choose a region → start in **test mode** (you'll apply proper rules later)
4. Go to **Build → Authentication** → Get started → **Sign-in method** tab → enable **Anonymous**

#### Get your config

1. In the Firebase console, go to **Project Settings** (gear icon) → **Your apps**
2. Click the web icon (`</>`) to register a web app
3. Copy the `firebaseConfig` object

#### Update `firebaseConfig.ts`

Replace the values in `firebaseConfig.ts` with your own:

```ts
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  databaseURL: 'https://YOUR_PROJECT-default-rtdb.REGION.firebasedatabase.app',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

#### Apply security rules

In the Firebase console, go to **Realtime Database → Rules** and paste the contents of `firebase/database.rules.json`, then click **Publish**.

---

### 4. Start the development server

```bash
npm start
```

This opens the **Expo Dev Tools** in your terminal. From there:

| Command      | Action                                        |
| ------------ | --------------------------------------------- |
| Press `a`    | Open on Android emulator                      |
| Press `i`    | Open on iOS simulator (macOS only)            |
| Scan QR code | Open in **Expo Go** on your phone             |
| Press `w`    | Open in browser (limited — no mobile sensors) |

Or run directly:

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator
npm run web       # Browser
```

---

## Testing Multiplayer Locally

To simulate multiple players on one machine:

1. Run `npm start`
2. Open **Expo Go** on two or more physical phones and scan the QR code, **or**
3. Open the app in a browser (`w`) across **multiple tabs** — each tab gets its own anonymous session, so they act as separate players

> **Note:** Browser tabs work well for quick testing. Each tab is treated as a unique player due to `browserSessionPersistence` in Firebase Auth.

**Recommended test flow:**

1. Tab 1 → Enter nickname → Create Room → choose pack + timer → arrives in lobby
2. Tab 2 → Enter nickname → Join Room → enter the 4-digit code → arrives in same lobby
3. Tab 1 (host) → Start Game
4. Both tabs answer the prompt within the timer
5. After timer, answers reveal with clustering + scores
6. Host advances through rounds → final leaderboard after round 5

---

## Question Packs

Packs are stored locally in `src/data/packs.ts`. Currently included:

| Pack                  | Description                                              |
| --------------------- | -------------------------------------------------------- |
| ⭐ The Essentials     | Easy everyday basics — great for first games             |
| 🍕 The Foodie Pack    | Food-themed questions — best played hungry               |
| 🎬 The Screen & Stage | Movies, music, and internet culture                      |
| 🧩 The Deep End       | Abstract and weird — no right answers, only popular ones |

The host can select **multiple packs** when creating a room, and can edit the selection from the lobby before the game starts. Questions are drawn from the combined pool of all selected packs.

---

## Firebase Security Rules

Rules are in `firebase/database.rules.json`. Key points:

- Any authenticated user can **read** a room
- Only the host can **write** to the root room object (phase, prompts, scores)
- Players can only **write their own** player entry and answers
- Answer nodes are **hidden** from other players during the guessing phase — only the host reads them to run scoring

---

## Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start in browser
npm run lint       # Run ESLint
```
