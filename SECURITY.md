# Security Policy

## Keeping Your API Keys Safe

**Never commit real API keys to git.** This is the most important rule.

### What is .env.local?
The `.env.local` file is where you put your real API keys. It is listed in `.gitignore` so git will never upload it to GitHub. Only you can see it on your computer.

### What is .env.example?
The `.env.example` file is a safe template that shows the *shape* of the config — which variables exist and what they do — but contains no real secrets. It is safe to share publicly.

### Quick checklist before pushing to GitHub
- [ ] `.env.local` is in your `.gitignore`
- [ ] You only copied `.env.example` — never `.env.local` — to your repo
- [ ] You searched your code for `gsk_`, `sk-ant-`, `AIza`, `xai-` — none found
- [ ] Run: `git log --all --full-history -- .env.local` — should show nothing

### If you accidentally commit a key
1. Immediately revoke the key at the provider's dashboard (Groq, Anthropic, etc.)
2. Generate a new key
3. Remove the key from git history: `git filter-branch` or use [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
4. Force push the cleaned history: `git push --force`

Revoking is faster and more important than cleaning history — do that first.

---

## Reporting a Security Issue

If you find a security vulnerability in this project:

1. **Do NOT open a public GitHub issue** — that would expose the problem to everyone
2. Email the maintainer directly or open a [GitHub Security Advisory](https://docs.github.com/en/code-security/security-advisories) (private)
3. Describe what you found, how to reproduce it, and what the impact could be
4. Give a reasonable amount of time to fix before disclosing publicly

---

## What Data Does This App Store?

- Notes are saved in your **browser's localStorage** — they never leave your device
- Notes are sent to your chosen **AI provider** (Groq, Ollama, etc.) for analysis
- If using Ollama: everything stays on your computer — 100% private
- If using Groq/Claude/Gemini: your note content is sent to that company's API

Choose Ollama if you want complete privacy.

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main branch) | Yes |
| Older commits | Best effort |
