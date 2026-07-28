# Technical Preferences

<!-- Adopted for 江湖一生 · Jianghu Life Engine (Web) -->

## Engine & Language

- **Engine**: Web browser (Vite 6)
- **Language**: TypeScript (strict)
- **Rendering**: DOM + CSS（水墨主題）；無 WebGL 需求（MVP）
- **Physics**: N/A（人生模擬，非動作物理）

## Input & Platform

- **Target Platforms**: Web / Mobile browser (PWA)
- **Input Methods**: Touch, Mouse
- **Primary Input**: Touch
- **Gamepad Support**: None
- **Touch Support**: Full (420px phone frame)
- **Platform Notes**: GitHub Pages base path `/App/`；`VITE_BASE` for builds

## Naming Conventions

- **Types / Interfaces**: PascalCase（`LifeGameState`, `GameEvent`）
- **Variables / functions**: camelCase
- **Files**: camelCase or kebab for components（`LifeGameScreen.tsx`）
- **Events IDs**: snake_case（`life_birth`, `sect_recruit`）
- **Constants**: SCREAMING_SNAKE or exported const camelCase

## Performance Budgets

- **Target Framerate**: 60fps UI（無重模擬幀循環）
- **Bundle**: keep event catalog data-driven; avoid huge inline story strings in UI
- **Memory Ceiling**: browser tab（IndexedDB save size small）

## Testing

- **Framework**: Vitest
- **Minimum Coverage**: Event catalog Zod validation + engine determinism + requirements gates
- **Required Tests**: Seeded RNG, `applyChoice`, year advance, save roundtrip when changed

## Forbidden Patterns

- `Math.random()` inside simulation / event resolution（use `getRng()`）
- Hardcoding story branches in React components（use `data/events/catalog.ts`）
- Purple-glow generic AI landing aesthetics for branded surfaces（水墨方向）

## Allowed Libraries / Addons

- react, react-dom
- zustand
- zod
- vite, vitest
- @vitejs/plugin-react

## Architecture Decisions Log

- Event-driven life engine (`core/life/*`) as V1 primary loop
- Legacy tick world sim (`core/gameplay.ts`) retained but not default UI entry
- IndexedDB + localStorage fallback for saves

## Project-Specific Notes

- Attributes: 根骨 genGu, 悟性 wuXing, 福緣 fuYuan, 魅力 meiLi, 膽識 danShi
- Path aliases: `@core/*`, `@interfaces/*`, `@data/*`
