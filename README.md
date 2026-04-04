# Second Brain

A personal knowledge management system powered by vector embeddings and semantic search. Built with Next.js 15, TypeScript, and Groq (Llama 3).

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

---

## Overview

Second Brain turns freeform notes into a queryable knowledge graph. Each note is vectorized into a 20-dimensional concept space, connected to similar notes via cosine similarity, and rendered as a force-directed graph. A RAG chat interface lets you ask questions grounded in your own notes rather than generic AI responses.

The goal: capture ideas fast, surface connections automatically, and retrieve knowledge by meaning rather than exact keywords.

---

## How It Works

**Ingestion pipeline:**
1. Note text is sent to `/api/analyze` — Groq runs Llama 3 and returns structured JSON: tags, key insight, summary, and a 20-float concept vector
2. The vector maps the note across 20 domains (AI/ML, Code, Health, Finance, Philosophy, etc.), each dimension scored 0.0–1.0
3. Notes with cosine similarity above 0.4 are connected as edges in the graph

**Semantic search:**
- Query text hits `/api/search`, returns a concept vector
- Client ranks all stored notes by cosine similarity against that vector
- Results surface by meaning, not substring match

**RAG chat:**
- Question is vectorized via `/api/search`
- Top 5 notes by similarity (threshold > 0.25) are retrieved as context
- `/api/chat` sends the question + context to Groq — answer is grounded in your actual notes

**Graph layout:**
- Fruchterman-Reingold force simulation runs 100–120 iterations on each state change
- Repulsion: `k² / distance` keeps nodes spread
- Attraction: `distance² / k × similarity` pulls related notes together
- Rendered on HTML5 Canvas, interactive (drag, zoom, pan)

**Persistence:**
- All notes stored in `localStorage` — no database, no backend state
- Export/import as JSON for backup or migration

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR + API routes |
| Language | TypeScript | Type safety |
| AI Provider | Groq (Llama 3.3 70B) | Note analysis, search, chat |
| Rendering | HTML5 Canvas | Knowledge graph |
| Storage | localStorage | Client-side persistence |
| Deployment | Vercel | Hosting + edge functions |

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts   # Vectorizes notes via Groq, returns structured analysis
│   │   ├── search/route.ts    # Turns query text into a concept vector
│   │   └── chat/route.ts      # RAG chat endpoint — question + context → answer
│   ├── page.tsx               # Main client shell, state wiring
│   └── layout.tsx             # HTML wrapper, metadata
├── components/                # UI layer (9 components)
│   ├── KnowledgeGraph.tsx     # Canvas graph + physics loop
│   ├── ChatPanel.tsx          # RAG chat UI with source citations
│   ├── NoteInput.tsx          # Note entry form
│   ├── NoteList.tsx           # Sidebar note list
│   ├── NoteCard.tsx           # Individual note card
│   ├── NodeDetail.tsx         # Expanded node view on click
│   ├── SearchBar.tsx          # Semantic search input
│   ├── DimensionLegend.tsx    # Color legend for 20 dimensions
│   └── Header.tsx             # Stats + controls bar
├── hooks/
│   ├── useNotes.ts            # Note state, API calls, chatWithBrain, storage
│   └── useForceGraph.ts       # Physics simulation loop + graph state
└── lib/
    ├── ai.ts                  # Multi-provider abstraction (Groq/Claude/Gemini/Ollama/Grok)
    ├── vectorMath.ts          # Cosine similarity, dot product, normalization
    ├── forceLayout.ts         # Fruchterman-Reingold algorithm
    ├── colors.ts              # 20 dimension color map
    └── storage.ts             # localStorage save/load/export/import
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free Groq API key — [console.groq.com](https://console.groq.com)

### Installation

```bash
git clone https://github.com/kongaravinay/SecondBrain.git
cd SecondBrain
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Push repo to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Set environment variables: `AI_PROVIDER`, `GROQ_API_KEY`, `GROQ_MODEL`
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## Vector Math

Each note is embedded into a 20-dimensional vector where each dimension corresponds to a concept domain:

```
[AI/ML, Code, Math, Science, Business, Health, Philosophy,
 Art, History, Psychology, Physics, Biology, Society,
 Education, Tech, Personal, Language, Systems, Data, Other]
```

Semantic similarity between two notes uses cosine similarity:

```
similarity(A, B) = dot(A, B) / (‖A‖ × ‖B‖)
```

Where:
- `dot(A, B)` = sum of element-wise products
- `‖A‖` = sqrt of sum of squared elements

Result is 0.0–1.0. Notes above 0.4 get a visible edge in the graph.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AI_PROVIDER` | Yes | `groq` \| `ollama` \| `claude` \| `gemini` \| `grok` |
| `GROQ_API_KEY` | If using Groq | Free at console.groq.com |
| `GROQ_MODEL` | No | Defaults to `llama-3.3-70b-versatile` |
| `ANTHROPIC_API_KEY` | If using Claude | console.anthropic.com |
| `GOOGLE_API_KEY` | If using Gemini | aistudio.google.com |
| `XAI_API_KEY` | If using Grok | console.x.ai |
| `OLLAMA_URL` | If using Ollama | Default: `http://localhost:11434` |

Never commit `.env.local`. It is gitignored. Use `.env.example` as the template.

---

## Roadmap

- [ ] Multi-user support with auth
- [ ] Export as Markdown / Obsidian vault
- [ ] Obsidian plugin integration
- [ ] Mobile-responsive graph view
- [ ] Custom embedding dimensions
- [ ] Voice note input

---

## Contributing

Pull requests welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## License

MIT — see [LICENSE](LICENSE).
