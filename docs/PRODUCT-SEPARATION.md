# Product separation — WorthBook vs 江湖一生

This GitHub repository historically hosted **江湖一生 (Jianghu Life Engine)**.
`main` was later replaced by **WorthBook** (net-worth PWA, Next.js). The two
products must stay **separate** — do not merge their source trees.

## Ownership

| Product | Canonical git line | Stack | Live URL (GitHub Pages) |
|---------|--------------------|-------|-------------------------|
| WorthBook | `main` | Next.js + Tailwind | https://wyc3809.github.io/App/worthtracker/ |
| 江湖一生 | `cursor/jianghu-engine-c645` (and feature branches off it) | Vite + React | https://wyc3809.github.io/App/ |

> Prefer moving 江湖一生 to its own GitHub repo when ready (see below). Until
> then, treat the Jianghu branches as a **separate product line** inside this
> remote — never open PRs that merge Jianghu → WorthBook `main` or vice versa.

## Rules

1. **No cross-merge** of application source (`package.json`, `src/`, `core/`,
   frameworks, CI that assumes one stack).
2. **gh-pages coexistence is OK**: WorthBook deploy overlays `/worthtracker/`
   and must preserve the game files at the Pages root. Game deploys must
   preserve `worthtracker/` and `.nojekyll`.
3. **Issues / PRs**: label or title with the product name; Jianghu work targets
   Jianghu branches only.
4. **Shared ink-pack assets** under `assets/ink-pack/` are game art references;
   WorthBook does not depend on them for runtime.

## Optional: split into two GitHub repositories

When you create an empty repo (e.g. `wyc3809/jianghu-life`):

```bash
git clone https://github.com/wyc3809/App.git jianghu-life
cd jianghu-life
git checkout cursor/jianghu-engine-c645
git remote rename origin app-old
git remote add origin https://github.com/wyc3809/jianghu-life.git
git push -u origin cursor/jianghu-engine-c645:main
```

Then point Pages / Cloudflare for the game at the new repo, and keep
`wyc3809/App` as WorthBook-only.
