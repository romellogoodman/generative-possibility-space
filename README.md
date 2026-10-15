# GPS — Generative possibility space

A demo of different ways to browse generative outputs: an infinite canvas, a table of
properties, and a focus view that shows variations of one output. For now every output is a
grey square.

Live at [gps.romellogoodman.com](https://gps.romellogoodman.com).

React 19 + Vite + SCSS.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8080
```

## Scripts

```bash
npm run dev           # Start dev server (port 8080)
npm run build         # Build for production
npm run lint          # Check for errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
npm run preview       # Preview production build
```

See [CLAUDE.md](CLAUDE.md) for a map of the code and project conventions.

## Use GPS on your own outputs

[`skills/gps`](skills/gps) is a Claude Code skill. It adds these views to a project that
generates outputs, using your real outputs and settings instead of grey squares. To
install it, run this from your project:

```bash
npx degit romellogoodman/generative-possibility-space/skills/gps .claude/skills/gps
```

Then run `/gps` in Claude Code, or ask it to "add GPS views to this project".
[patterns.md](skills/gps/patterns.md) lists every view and what it needs.
