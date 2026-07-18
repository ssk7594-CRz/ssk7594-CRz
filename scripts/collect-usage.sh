#!/usr/bin/env bash
# collect-usage.sh
# 로컬 머신에서 실행 → Claude Code + Codex CLI 실사용량을 data/usage.json 으로 집계하고
# SVG 카드/뱃지 재생성 후 커밋·푸시까지 수행한다.
#
# 사용법:
#   bash scripts/collect-usage.sh          # 집계 + 렌더 + 커밋/푸시
#   bash scripts/collect-usage.sh --no-push  # 집계 + 렌더만 (커밋 X)
#
# 요구사항: node, npx (bun 있으면 bunx), git
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p data assets

RUN="npx -y"
command -v bunx >/dev/null 2>&1 && RUN="bunx"

echo "==> Claude Code 사용량 집계 (ccusage)"
# --json: 일자별/누적 집계를 JSON으로. 로컬 로그(~/.claude) 없으면 빈 결과.
CLAUDE_JSON="$($RUN ccusage@latest --json 2>/dev/null || echo '{}')"

echo "==> Codex CLI 사용량 집계 (@ccusage/codex)"
CODEX_JSON="$($RUN @ccusage/codex@latest --json 2>/dev/null || echo '{}')"

echo "==> usage.json 병합"
node scripts/merge-usage.mjs \
  --claude "$CLAUDE_JSON" \
  --codex "$CODEX_JSON" \
  > data/usage.json
echo "    -> data/usage.json"

echo "==> SVG 카드 + 뱃지 렌더"
node scripts/render-card.mjs
echo "    -> assets/ai-usage.svg, data/badge-claude.json, data/badge-codex.json"

if [[ "${1:-}" == "--no-push" ]]; then
  echo "==> --no-push: 커밋 생략"
  exit 0
fi

echo "==> git commit & push"
git add data/usage.json data/badge-claude.json data/badge-codex.json assets/ai-usage.svg
if git diff --cached --quiet; then
  echo "    변경 없음, 커밋 생략"
else
  git commit -m "chore: update AI usage stats ($(date +%Y-%m-%d))"
  git push
  echo "    -> pushed"
fi
