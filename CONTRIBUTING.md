# Contributing to Second Brain

Thank you for wanting to make this better! Here is how to help.

---

## Ways to Contribute

- **Bug reports** — Found something broken? Open a GitHub issue
- **Feature ideas** — Have a cool idea? Open an issue and describe it
- **Code improvements** — Fix a bug, improve performance, or add a feature
- **Documentation** — Improve the README, add examples, fix typos
- **AI provider support** — Add a new provider to `src/lib/ai.ts`

---

## Getting Started

**1. Fork the repo**
Click the **Fork** button on GitHub to get your own copy.

**2. Clone your fork**
```bash
git clone https://github.com/YOUR_USERNAME/SecondBrain.git
cd SecondBrain
```

**3. Install dependencies**
```bash
npm install
```

**4. Set up your environment**
```bash
cp .env.example .env.local
# Edit .env.local with your own API key
```

**5. Start the dev server**
```bash
npm run dev
```

**6. Make your changes**
Edit files in `src/`. The app hot-reloads automatically.

**7. Test your changes**
- Add a note and confirm it analyzes correctly
- Check the knowledge graph renders without errors
- Test search returns relevant results
- Open the browser console — no red errors

**8. Submit a Pull Request**
Push to your fork and open a PR on the main repo. Describe what you changed and why.

---

## Code Style

- TypeScript everywhere — no `any` unless unavoidable
- Keep components small and focused on one job
- Put reusable logic in `src/hooks/` or `src/lib/`
- No external UI libraries — this project uses only HTML Canvas and plain React

---

## Adding a New AI Provider

The universal AI layer lives in `src/lib/ai.ts`. To add a new provider:

1. Add a new `Provider` type value
2. Write a `chatYourProvider(messages, options)` function
3. Add a case in the main `chat()` switch statement
4. Add the env var template to `.env.example`
5. Document it in the README

---

## Project Structure Cheat Sheet

```
src/app/api/       ← Backend: API routes (Next.js server)
src/components/    ← Frontend: React UI components
src/hooks/         ← Shared React logic (state + effects)
src/lib/           ← Pure utility functions (no React)
```

---

## Questions?

Open a GitHub issue with the label `question`. No question is too basic.
