# 🐉 Dragon's Treasure

A minigame built on [GenLayer](https://genlayer.com)'s AI-powered intelligent contracts. Players write persuasive pleas to convince **Drakarion**, an ancient dragon, to share his treasure hoard. The dragon's decisions are evaluated by real AI running inside a blockchain smart contract with multi-validator consensus.

<div align="center">
  <video src="client/public/demo.mp4" width="100%" controls autoplay muted loop>
    Your browser does not support the video tag.
  </video>
</div>

---

## How It Works

1. **Deploy** the Python intelligent contract on [GenLayer Studio](https://studio.genlayer.com) (Studionet).
2. **Connect** by pasting the deployed contract address into the app.
3. **Write a plea** — be creative, clever, or emotionally compelling.
4. **Submit** — your plea is sent to the blockchain. GenLayer validators run the AI contract and reach consensus on whether Drakarion grants or denies your request.
5. **Results** appear with the dragon's reasoning. Stats update on-chain.

The dragon denies ~70% of requests. Simple demands or threats are always rejected — only truly impressive pleas succeed.

---

## Project Structure

```
dragon-minigame/
├── contracts/
│   └── dragon_treasure.py      # GenLayer Python intelligent contract
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx             # React root (routing, providers)
│       ├── main.tsx            # Entry point
│       ├── index.css           # Global styles (TailwindCSS)
│       ├── pages/
│       │   ├── home.tsx        # Main game UI
│       │   └── not-found.tsx
│       ├── components/
│       │   ├── contract-setup.tsx    # Onboarding wizard (deploy + connect)
│       │   ├── dragon-response.tsx   # Displays dragon verdict
│       │   ├── game-stats.tsx        # Live stats (treasure, attempts, success rate)
│       │   ├── genlayer-console.tsx  # Terminal-style RPC activity log
│       │   ├── history-panel.tsx     # Scrollable plea history (localStorage)
│       │   └── ui/                   # shadcn/ui component library
│       ├── hooks/
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       └── lib/
│           ├── genlayer.ts     # All blockchain interactions (read/write/poll)
│           ├── console-log.ts  # In-memory pub/sub log bus
│           ├── queryClient.ts  # TanStack Query config
│           └── utils.ts        # cn() class utility
├── server/
│   ├── index.ts        # Express server bootstrap + request logging
│   ├── routes.ts       # /api/health and /api/genlayer-rpc CORS proxy
│   ├── storage.ts      # MemStorage stub (reserved for future DB use)
│   ├── static.ts       # Production static file serving
│   └── vite.ts         # Dev mode Vite middleware
├── shared/
│   └── schema.ts       # Zod schemas: GameResult, GameStats, PleaInput, GameHistoryEntry
├── script/
│   └── build.ts        # esbuild production bundler
├── vite.config.ts      # Vite config (aliases: @, @shared, @assets)
├── drizzle.config.ts   # Drizzle ORM config (PostgreSQL, DATABASE_URL)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## The Intelligent Contract (`contracts/dragon_treasure.py`)

Written in Python using the GenLayer SDK. Deployed on Studionet.

### State
| Variable | Type | Initial |
|---|---|---|
| `treasure_count` | `u256` | `100` |
| `total_attempts` | `u256` | `0` |
| `successful_claims` | `u256` | `0` |

### Methods
- **`claim_treasure(plea: str) → str`** *(write)* — Runs an AI prompt via `gl.nondet.exec_prompt`. Uses `gl.eq_principle.prompt_non_comparative` for multi-validator consensus. Returns `{success, message, reasoning, amount}` JSON.
- **`get_stats() → str`** *(view)* — Returns `{treasure_remaining, total_attempts, successful_claims}`.
- **`get_treasure_count() → int`** *(view)* — Returns raw remaining treasure.

---

## Frontend

Built with **React 18 + Vite + TailwindCSS + shadcn/ui**.

### Key Libraries
| Package | Role |
|---|---|
| `genlayer-js` | GenLayer blockchain SDK |
| `framer-motion` | Animations on results and verdict cards |
| `wouter` | Lightweight client-side router |
| `@tanstack/react-query` | Server state management |
| `drizzle-orm` + `pg` | ORM (configured, reserved for future use) |
| `zod` | Schema validation (shared between client/server) |

### Account Management
A private key is auto-generated on first visit and persisted in `localStorage`. No seed phrase or wallet connection required — the app manages an ephemeral account automatically.

### Transaction Flow
```
User submits plea
  → client.writeContract("claim_treasure", [plea])   via /api/genlayer-rpc
    → GenLayer validators run the AI contract
    → Multi-validator consensus on the dragon's decision
  → Poll for FINALIZED receipt (up to 6 min, 120 × 3s retries)
  → Extract result JSON from receipt (with base64 + deep-search fallbacks)
  → Render DragonResponse, update history + stats
```

---

## Backend

The Express server is intentionally minimal — it acts as a **CORS proxy** to the GenLayer Studio RPC endpoint.

| Route | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/genlayer-rpc` | POST | Proxies all RPC calls to `https://studio.genlayer.com/api` |

In development, Vite's dev server is mounted as middleware (hot reload). In production, built static files are served directly.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A deployed contract on [GenLayer Studio](https://studio.genlayer.com) (Studionet)

### Install & Run

```bash
npm install
npm run dev        # Starts dev server on http://localhost:5000
```

> Works on **Windows, macOS, and Linux** — `cross-env` handles `NODE_ENV` cross-platform.

### Build for Production

```bash
npm run build
npm start
```

### Available Scripts
| Script | Description |
|---|---|
| `npm run dev` | Start development server (port 5000) |
| `npm run build` | Build production bundle |
| `npm start` | Run production server |
| `npm run check` | TypeScript type check |
| `npm run db:push` | Push schema to PostgreSQL via Drizzle |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `5000`) |
| `DATABASE_URL` | Only for `db:push` | PostgreSQL connection string |
