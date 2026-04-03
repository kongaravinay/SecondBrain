# Second Brain — AI Knowledge Graph

A personal knowledge management app that turns your notes into a living, visual knowledge graph. Every note gets analyzed by AI into a 20-dimensional concept vector. Similar notes connect automatically. Your knowledge becomes a map.

![Second Brain](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![License](https://img.shields.io/badge/license-MIT-green)
![AI](https://img.shields.io/badge/AI-Ollama%20%7C%20Groq%20%7C%20Claude%20%7C%20Gemini-purple)
![Free](https://img.shields.io/badge/cost-free%20with%20Ollama-brightgreen)

## What It Does

- Write any note — idea, fact, thought, thing you learned
- AI analyzes it into tags, summary, key insight, and a 20-dimension concept vector
- Notes appear as colored nodes on a force-directed knowledge graph
- Similar notes connect automatically using cosine similarity
- Semantic search finds related notes by meaning, not just keywords
- Everything persists in your browser — no account needed

## Demo

```
Note: "Neural networks learn by adjusting weights through backpropagation"
→ Tags: [AI, neural-networks, machine-learning, backpropagation]
→ Category: AI/ML (purple node)
→ Vector: [0.95, 0.4, 0.7, 0.3, 0.0, ...]
→ Connects to: your other AI/math/programming notes
```

## Quick Start

### Option 1 — Local & Free with Ollama (Recommended)

```bash
# 1. Install Ollama: https://ollama.com
ollama pull qwen2.5:7b

# 2. Clone and install
git clone https://github.com/yourusername/second-brain
cd second-brain
npm install

# 3. Configure
cp .env.example .env.local
# .env.local is pre-configured for Ollama — no changes needed

# 4. Run
ollama serve          # terminal 1
npm run dev           # terminal 2

# 5. Open http://localhost:3000
```

### Option 2 — Free Cloud with Groq

```bash
# 1. Get free API key at https://console.groq.com
# 2. Clone and install
git clone https://github.com/yourusername/second-brain
cd second-brain
npm install

# 3. Configure
cp .env.example .env.local
```

Edit `.env.local`:
```
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

```bash
npm run dev
```

### Option 3 — Claude or Gemini

Same steps, just set `AI_PROVIDER=claude` or `AI_PROVIDER=gemini` and add the matching API key.

## AI Providers

| Provider | Cost | Speed | Quality | Setup |
|---|---|---|---|---|
| **Ollama** (local) | Free forever | Medium | Great | Install Ollama |
| **Groq** | Free tier | Fastest | Excellent | API key |
| **Google Gemini** | Free tier | Fast | Good | API key |
| **Anthropic Claude** | ~$0.006/note | Fast | Best | API key |

## How the Vector Math Works

Each note gets a 20-dimensional concept vector from the AI:

```
Dimensions: AI/ML · Programming · Mathematics · Science · Business ·
            Health · Philosophy · Art · History · Psychology · Physics ·
            Biology · Society · Education · Technology · Personal ·
            Language · Systems · Data · Other
```

**Cosine Similarity** between two notes:
```
similarity = dot(a, b) / (|a| × |b|)

where:
  dot(a, b) = Σ a[i] × b[i]
  |v|       = √(Σ v[i]²)

Result: 1.0 = identical topics, 0.0 = completely unrelated
```

**Force-Directed Layout** (Fruchterman-Reingold algorithm):
```
k         = √(canvas_area / num_nodes)
repulsion = k² / distance          (all pairs)
attraction = distance² / k × sim   (connected pairs only)
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Main application
│   └── api/
│       ├── analyze/route.ts     # Note → AI analysis
│       └── search/route.ts      # Query → search vector
├── components/
│   ├── KnowledgeGraph.tsx       # Canvas force-directed graph
│   ├── NoteInput.tsx            # Add notes + analysis display
│   ├── NoteList.tsx             # Sidebar note list
│   ├── NodeDetail.tsx           # Click-to-expand note details
│   ├── SearchBar.tsx            # Semantic search
│   ├── DimensionLegend.tsx      # 20-color dimension legend
│   └── Header.tsx               # Stats + controls
├── hooks/
│   ├── useNotes.ts              # Note state management
│   └── useForceGraph.ts         # Physics simulation
└── lib/
    ├── ai.ts                    # Universal AI provider (Ollama/Groq/Claude/Gemini)
    ├── vectorMath.ts            # Cosine similarity, dot product, magnitude
    ├── forceLayout.ts           # Fruchterman-Reingold algorithm
    ├── colors.ts                # 20 dimension colors
    └── storage.ts               # localStorage persistence
```

## Deploy to Vercel (free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# AI_PROVIDER = groq
# GROQ_API_KEY = your_key
```

Your app will be live at `https://your-project.vercel.app`

## Tech Stack

- **Next.js 15** — React framework with API routes
- **React 19** — UI components
- **TypeScript** — Type-safe code
- **HTML Canvas** — Knowledge graph rendering
- **localStorage** — Client-side persistence (no database needed)
- **Bun** — Fast package manager and runtime

## Contributing

Pull requests welcome. Open an issue first for major changes.

## License

MIT — free to use, modify, and distribute.
