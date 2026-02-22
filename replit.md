# replit.md

## Overview

Dragon's Treasure is an AI-powered minigame built on GenLayer's intelligent blockchain. Players interact with "Drakarion," an AI dragon guarding a treasure hoard, by submitting creative pleas to convince it to share treasure. The dragon (powered by GenLayer's AI smart contract) evaluates each plea and decides whether to grant treasure based on creativity and emotional appeal. The project showcases GenLayer's ability to run AI-driven logic directly in smart contracts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React SPA)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with two routes: Home and 404
- **UI Components**: shadcn/ui component library built on Radix UI primitives, styled with Tailwind CSS
- **State Management**: React Query (@tanstack/react-query) for server state, React useState for local state
- **Animations**: Framer Motion for UI transitions
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (Express API Server)
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx)
- **Purpose**: Minimal — primarily serves as an RPC proxy to GenLayer's blockchain API
- **Key endpoint**: `POST /api/genlayer-rpc` — proxies JSON-RPC requests to `https://studio.genlayer.com/api` to avoid CORS issues and keep the RPC URL server-side
- **Health check**: `GET /api/health`
- **Storage**: In-memory storage class exists (`MemStorage`) but is essentially empty — the app doesn't use a traditional database for game state. All game state lives on the GenLayer blockchain and in the client's localStorage.
- **Dev mode**: Vite dev server runs as middleware with HMR
- **Production**: Static files served from `dist/public`

### Smart Contract (GenLayer/Python)
- Located in `contracts/dragon_treasure.py`
- Written in Python using GenLayer's contract SDK (`genlayer` package)
- Maintains on-chain state: `treasure_count`, `total_attempts`, `successful_claims`
- Uses `gl.nondet.exec_prompt()` to run AI prompts that evaluate player pleas
- AI acts as "Drakarion" the dragon — denies ~70% of requests, awards 1-5 treasure for creative pleas
- The contract is deployed via GenLayer Studio; the frontend guides users through deployment or entering an existing contract address

### Client-Blockchain Integration
- **Library**: `genlayer-js` SDK for client-side blockchain interaction
- **Account management**: Private keys auto-generated and stored in localStorage
- **Contract address**: Stored in localStorage; users can deploy new contracts or enter existing ones
- **Game history**: Stored in localStorage (up to 50 entries)
- **Console log system**: Custom pub/sub logging system (`console-log.ts`) that displays RPC calls and responses in a terminal-like UI panel

### Data Flow
1. User types a plea in the frontend
2. Frontend calls `claimTreasure()` which uses genlayer-js to send a write transaction
3. genlayer-js sends JSON-RPC through the Express proxy (`/api/genlayer-rpc`)
4. Proxy forwards to GenLayer Studio API
5. GenLayer smart contract runs the AI prompt and returns a result
6. Frontend displays the dragon's response and updates local history

### Schema (shared/schema.ts)
- Uses Zod for validation (no Drizzle tables defined despite drizzle config existing)
- `GameResult`: success boolean, message, reasoning, amount
- `GameStats`: treasure_remaining, total_attempts, successful_claims
- `PleaInput`: validated plea string (1-500 chars)
- `GameHistoryEntry`: id, plea, result, timestamp

### Database Note
- `drizzle.config.ts` is configured for PostgreSQL but `shared/schema.ts` contains no Drizzle table definitions — only Zod schemas
- The app currently doesn't use a database; all persistent state is on-chain or in localStorage
- If a database is needed later, add Drizzle table schemas to `shared/schema.ts` and run `npm run db:push`

### Build System
- **Dev**: `npm run dev` — runs tsx with Vite middleware
- **Build**: `npm run build` — Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Production**: `npm start` — runs the bundled server

## External Dependencies

### GenLayer Blockchain
- **RPC Endpoint**: `https://studio.genlayer.com/api` (proxied through Express)
- **Chain**: Studionet (GenLayer's test network)
- **SDK**: `genlayer-js` npm package for client-side blockchain interaction
- **Smart contract language**: Python with `genlayer` SDK

### Frontend Libraries
- React 18, Vite, TypeScript
- Tailwind CSS with shadcn/ui (Radix UI primitives)
- Framer Motion for animations
- Wouter for routing
- @tanstack/react-query for async state

### Replit-specific
- `@replit/vite-plugin-runtime-error-modal` — error overlay in dev
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` — dev tools (conditional)

### Database (configured but unused)
- PostgreSQL via `DATABASE_URL` environment variable
- Drizzle ORM + drizzle-kit for schema management
- `connect-pg-simple` for session storage (available but not actively used)