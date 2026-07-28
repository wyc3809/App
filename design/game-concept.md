# Game Concept — 江湖一生

## Elevator pitch

BitLife × 武俠：玩家體驗一段可重玩的人生，內容由事件資料庫驅動。

## Core loop

出生 → 家庭 → 成長 → 拜師 → 江湖 → 戀愛 → 門派 → 戰鬥 → 財富 → 老年 → 死亡 → 人生總結 → 傳承

## Systems (8)

1. 角色屬性（根骨、悟性、福緣、魅力、膽識）
2. NPC 記憶與關係
3. 門派及職級
4. 武功修煉與突破
5. 世界事件
6. 經濟與產業
7. 家族與傳承
8. JSON 事件引擎

## Current stage

- **Playable MVP (V1.0)** on web: create life → yearly events → choices → death summary
- Event catalog: 50 entries in `data/events/catalog.ts`
- Visual: ink-wash (水墨) UI
- Next: expand events, deepen NPC/sect systems, optional dual-mode with legacy tick engine

## Platform

Browser PWA · React + TypeScript + Vite · GitHub Pages: https://wyc3809.github.io/App/
