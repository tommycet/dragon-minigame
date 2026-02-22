# Dragon's Treasure - GenLayer Minigame

## Overview
An AI-powered minigame built on GenLayer's intelligent blockchain. Players write creative pleas to convince Drakarion the dragon to share its treasure. The dragon (powered by LLM via GenLayer's non-deterministic consensus) evaluates each plea and decides whether to grant treasure.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express (serves frontend + RPC proxy for GenLayer)
- **Blockchain**: GenLayer Studionet via genlayer-js SDK
- **Contract**: Python intelligent contract using gl.nondet.exec_prompt (with gl.exec_prompt fallback) for AI decisions

## Key Files
- `contracts/dragon_treasure.py` - The intelligent contract (Python) for GenLayer
- `client/src/lib/genlayer.ts` - GenLayer JS SDK client wrapper (uses backend proxy)
- `client/src/pages/home.tsx` - Main game page
- `client/src/components/contract-setup.tsx` - Contract deployment setup flow
- `client/src/components/dragon-response.tsx` - Dragon response display
- `client/src/components/game-stats.tsx` - Game statistics panel
- `client/src/components/history-panel.tsx` - Plea history sidebar
- `shared/schema.ts` - TypeScript types and Zod schemas
- `server/routes.ts` - Express routes including /api/genlayer-rpc proxy

## How It Works
1. User deploys the Python contract on GenLayer Studio (studionet)
2. User pastes the contract address in the app
3. App connects via genlayer-js SDK through backend RPC proxy to read/write the contract
4. Player writes a plea, which triggers `claim_treasure` on-chain
5. GenLayer validators run the LLM prompt and reach consensus
6. Result is displayed with dragon's reasoning

## Important Technical Details
- **RPC Proxy**: Browser requests to GenLayer studionet are proxied through `/api/genlayer-rpc` to avoid CORS issues
- **Consensus Design**: The contract uses `prompt_non_comparative` equivalence principle (with fallbacks to `prompt_non_comparative` old API and `strict_eq`). Only the leader validator's LLM decides; other validators check quality. Frontend also uses `leaderOnly: true` in writeContract to skip multi-validator consensus for reliable execution
- **API Compatibility**: Contract uses try/except fallbacks for both old (`gl.exec_prompt`) and new (`gl.nondet.exec_prompt`) GenLayer SDK APIs
- **Error Handling**: Frontend detects MAJORITY_DISAGREE, AttributeError, Traceback, and other contract execution errors with user-friendly messages

## Design Tokens
- Primary color: Orange/fire theme (hsl 25 95% 53%)
- Dark mode supported
- Font: Open Sans

## Recent Changes
- Feb 21, 2026: Fixed CORS issue by adding backend RPC proxy for GenLayer studionet
- Feb 21, 2026: Fixed consensus MAJORITY_DISAGREE by removing variable reasoning from nondet comparison
- Feb 21, 2026: Added API compatibility fallbacks for GenLayer SDK v0.1.3+ changes
- Feb 21, 2026: Initial build - contract, frontend, genlayer-js integration
