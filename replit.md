# Workspace

## Overview

pnpm workspace monorepo using TypeScript + a Python Streamlit voice finance assistant.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Python version**: 3.11
- **Finance App**: Streamlit + OpenAI (Whisper STT, GPT function calling, TTS)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `cd finance-assistant && streamlit run app.py --server.port 5000` — run the Streamlit finance assistant

## Finance Assistant (`finance-assistant/`)

Voice-based personal finance AI assistant built with:
- **STT**: OpenAI Whisper (`gpt-4o-mini-transcribe`) via Replit AI Integrations
- **LLM**: GPT with function calling for multi-intent query handling
- **TTS**: OpenAI TTS for voice responses
- **Languages**: Hindi, English, Hinglish
- **Mock DB**: Python dicts simulating realistic INR financial data

### Key Files
- `finance-assistant/app.py` — Streamlit UI
- `finance-assistant/ai_agent.py` — LLM agent loop with function calling
- `finance-assistant/finance_functions.py` — mock finance database + tool functions
- `finance-assistant/.streamlit/config.toml` — Streamlit server config

### Environment Variables
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — Replit AI Integrations proxy URL (auto-set)
- `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI Integrations API key (auto-set)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
