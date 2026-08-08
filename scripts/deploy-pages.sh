#!/usr/bin/env bash
# 部署江湖 Vite 到 gh-pages，並保留 worthtracker/ 子目錄（若已存在）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build:pages

PRESERVE_DIR="$(mktemp -d)"
DIST_COPY="$(mktemp -d)"
cp -a dist/. "$DIST_COPY/"

git fetch origin gh-pages 2>/dev/null || true
if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
  git archive origin/gh-pages worthtracker 2>/dev/null | tar -x -C "$PRESERVE_DIR" 2>/dev/null || true
fi

git checkout gh-pages
# 清掉舊站點檔（保留 .git）
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -a "$DIST_COPY"/. .
if [[ -d "$PRESERVE_DIR/worthtracker" ]]; then
  cp -a "$PRESERVE_DIR/worthtracker" .
  echo "Restored worthtracker/"
fi

git add -A
git status
echo "Review then: git commit -m 'deploy: jianghu pages' && git push origin gh-pages"
echo "Then return: git checkout cursor/huashan-bracket-ghosts-c645"
