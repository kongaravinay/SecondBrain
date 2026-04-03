# 🧠 Second Brain App

> Turn your notes into a living, visual map of everything you know — powered by free AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![AI](https://img.shields.io/badge/AI-Groq%20%7C%20Ollama%20%7C%20Claude%20%7C%20Gemini-purple)](.env.example)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

---

## 🤔 What is this? (Explain like I am 12)

Imagine you have a magical notebook. Every time you write something in it, a super-smart robot reads your note and figures out what it is about. Then it draws a map connecting all your notes — like a web where similar ideas are close together and different ideas are far apart.

That is your **Second Brain**. It remembers everything you write, finds connections you never noticed, and lets you search your knowledge just by describing what you are looking for — even if you use different words.

**Why is it cool?**
- You never forget anything you write
- It finds hidden connections between your ideas automatically
- You can search by meaning, not just keywords
- The more you add, the smarter and more connected it gets

---

## 🤖 How does the AI work? (Simple explanation)

### What is an API key?
An API key is like a password that lets your app talk to an AI service. When your app sends a note to the AI, it shows the key to prove it is allowed to use the service. Without the key, the AI ignores you.

### What is Groq?
Groq is a company that built special computer chips (called LPUs) that run AI models extremely fast — up to 10x faster than normal computers. They offer a **free tier** so anyone can use powerful AI without paying.

### What is Llama 3.3?
Llama 3.3 is an AI language model built by Meta (the company that made Facebook). It is one of the most powerful open-source AI models in the world. This app uses the **70 billion parameter** version — meaning it has 70 billion little dials and switches that all work together to understand language.

---

## 🔢 The Cool Math Inside (Simple explanation)

### What is a Vector?
A vector is just a list of numbers. In this app, every note gets turned into a list of **20 numbers** — like a fingerprint for that note.

Each number (from 0.0 to 1.0) says how much the note is about one topic:

```
Position 0  = AI/Machine Learning   → 0.95 (this note is mostly about AI)
Position 1  = Programming           → 0.80 (also a lot about coding)
Position 2  = Mathematics           → 0.30 (a little bit of math)
Position 3  = Science               → 0.10 (barely any science)
... and so on for 20 topics
```

So a note about Python programming might look like:
```
[0.20, 0.95, 0.30, 0.10, 0.05, 0.00, 0.00, 0.00, 0.00, 0.00,
 0.00, 0.00, 0.00, 0.10, 0.80, 0.00, 0.00, 0.40, 0.50, 0.00]
```

### What is Cosine Similarity?
Cosine similarity is how we measure if two notes are about the same thing. Imagine each note's 20 numbers as an arrow pointing in a direction. If two arrows point in nearly the same direction — the notes are similar. If they point in completely different directions — the notes are unrelated.

The formula:
```
similarity = dot_product(A, B) / (length(A) × length(B))

dot_product = multiply matching numbers and add them all up
length = square each number, add them, take the square root
```

Result is always between 0 and 1:
- **1.0** = notes are about exactly the same thing
- **0.7** = very similar topics
- **0.4** = somewhat related
- **0.0** = completely different

### What is the Knowledge Graph?
The knowledge graph is the visual map you see on screen. It has:
- **Nodes** = colored circles, one per note
- **Edges** = lines connecting similar notes
- **Colors** = each color means a different topic (purple = AI, blue = coding, green = science, etc.)
- **Physics** = the circles push and pull each other like magnets until they settle into a natural layout

### What is RAG?
RAG stands for **Retrieval Augmented Generation**. In simple terms: before the AI answers your question, it first reads your notes to find relevant ones, then uses that information to give you a smarter, more personal answer.

Like if you ask "what did I learn about focus?" — instead of making something up, the AI searches your notes first, finds your notes about productivity and meditation, then answers using YOUR knowledge.

---

## ✨ Features

- 🧠 **AI Note Analysis** — Every note gets tags, summary, key insight, and a 20-dim concept vector
- 🕸️ **Force-Directed Knowledge Graph** — Visual map with physics simulation (Fruchterman-Reingold algorithm)
- 🔍 **Semantic Search** — Find notes by meaning, not just keywords
- 🎨 **20 Knowledge Dimensions** — Color-coded categories: AI, Programming, Science, Business, Health, and more
- 🔗 **Auto-Connections** — Similar notes connect automatically based on cosine similarity
- 📊 **Node Detail Panel** — Click any node to see full details, top dimensions, and connected notes
- 💾 **Persistent Storage** — Notes saved in browser localStorage, survive page refresh
- 📤 **Export/Import** — Back up and restore your entire brain as JSON
- 🖱️ **Interactive Graph** — Drag nodes, zoom, pan, hover for previews
- 🆓 **Multiple Free AI Providers** — Ollama (local), Groq, Google Gemini — all free options
- 🌐 **Deploy Anywhere** — Works on Vercel, Netlify, or any Node.js host

---

## 🚀 How to Run It Yourself

### Prerequisites
- [Node.js 20+](https://nodejs.org) or [Bun](https://bun.sh)
- A free [Groq API key](https://console.groq.com) (takes 2 minutes)

### Step-by-step setup

**1. Clone the project**
```bash
git clone https://github.com/kongaravinay/SecondBrain.git
cd SecondBrain
```

**2. Install dependencies**
```bash
npm install
# or
bun install
```

**3. Get your free Groq API key**
- Go to [https://console.groq.com](https://console.groq.com)
- Sign up for free (use Google login)
- Click **API Keys** → **Create API Key**
- Copy the key — it starts with `gsk_`

**4. Create your .env.local file**
```bash
cp .env.example .env.local
```
Then open `.env.local` and replace `your_groq_key_here` with your real key:
```
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

**5. Start the app**
```bash
npm run dev
```

**6. Open your browser**
```
http://localhost:3000
```

---

## ☁️ How to Deploy to Vercel (Free)

**1.** Push your code to GitHub (see above)

**2.** Go to [vercel.com](https://vercel.com) and sign in with GitHub

**3.** Click **Add New Project** → select **SecondBrain**

**4.** Add environment variables in Vercel settings:
```
AI_PROVIDER = groq
GROQ_API_KEY = your_key_here
GROQ_MODEL = llama-3.3-70b-versatile
```

**5.** Click **Deploy** — you get a live URL in ~1 minute

Every time you push to GitHub, Vercel automatically redeploys.

---

## 📁 Project Structure

```
SecondBrain/
│
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Main app — connects all pieces together
│   │   ├── layout.tsx            ← HTML wrapper (fonts, meta tags)
│   │   ├── globals.css           ← Global dark theme styles
│   │   └── api/
│   │       ├── analyze/route.ts  ← Sends note to AI, gets back JSON analysis
│   │       └── search/route.ts   ← Turns search query into a concept vector
│   │
│   ├── components/               ← Visual building blocks
│   │   ├── KnowledgeGraph.tsx    ← The canvas graph with physics simulation
│   │   ├── NoteInput.tsx         ← Text box for adding notes
│   │   ├── NoteList.tsx          ← Scrollable list of all your notes
│   │   ├── NoteCard.tsx          ← One note card in the sidebar
│   │   ├── NodeDetail.tsx        ← Expands when you click a graph node
│   │   ├── SearchBar.tsx         ← Semantic search input
│   │   ├── DimensionLegend.tsx   ← Color legend for 20 knowledge categories
│   │   └── Header.tsx            ← Top bar with stats and controls
│   │
│   ├── hooks/                    ← Reusable logic
│   │   ├── useNotes.ts           ← Manages note state, API calls, storage
│   │   └── useForceGraph.ts      ← Physics simulation and graph state
│   │
│   └── lib/                      ← Pure utility functions
│       ├── ai.ts                 ← Universal AI provider (Groq/Ollama/Claude/Gemini/Grok)
│       ├── vectorMath.ts         ← Cosine similarity, dot product, magnitude
│       ├── forceLayout.ts        ← Fruchterman-Reingold physics algorithm
│       ├── colors.ts             ← 20 colors, one per knowledge dimension
│       └── storage.ts            ← localStorage save/load/export/import
│
├── .env.example                  ← Template for environment variables (safe to share)
├── .env.local                    ← Your real API keys (NEVER share this)
├── .gitignore                    ← Files git should never upload
├── next.config.ts                ← Next.js configuration
├── package.json                  ← Project dependencies
├── tsconfig.json                 ← TypeScript settings
├── LICENSE                       ← MIT open source license
├── README.md                     ← This file
├── SECURITY.md                   ← Security guidelines
└── CONTRIBUTING.md               ← How to contribute
```

---

## 🛠️ Tech Stack

| Technology | What it does |
|---|---|
| **Next.js 15** | React framework — handles both frontend UI and backend API routes |
| **React 19** | Builds the user interface from reusable components |
| **TypeScript** | JavaScript with type checking — catches bugs before they happen |
| **HTML Canvas** | Draws the knowledge graph — circles, lines, colors, animations |
| **Groq API** | Free cloud AI service — runs Llama 3.3 70B at blazing speed |
| **Ollama** | Runs AI models locally on your PC — 100% free and private |
| **localStorage** | Saves notes in your browser permanently — no database needed |
| **Bun** | Fast JavaScript package manager and runtime |
| **Vercel** | Hosts the app online for free with automatic deployments |

---

## 🔮 Future Ideas

1. **Chat with your brain** — Ask the AI questions and it searches your notes first before answering (full RAG implementation)
2. **Voice input** — Speak your notes instead of typing them
3. **Mobile app** — React Native version for capturing ideas on your phone
4. **Collaboration** — Share a knowledge graph with teammates
5. **AI summaries** — Auto-generate weekly summaries of what you learned

---

## 📄 License

MIT — free to use, modify, and share. See [LICENSE](LICENSE).

---

## 🌟 Like this project?

Star it on GitHub and share it with someone who loves learning!
