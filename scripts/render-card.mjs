#!/usr/bin/env node
// render-card.mjs
// data/usage.json -> assets/ai-usage.svg (터미널 스타일 카드)
//                 -> data/badge-claude.json, data/badge-codex.json (shields.io endpoint)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const usage = JSON.parse(readFileSync(ROOT + "data/usage.json", "utf8"));

const GREEN = "#00FF41";
const BG = "#0d1117";
const PANEL = "#010409";
const MUTED = "#8b949e";
const RED = "#ff5f56", YEL = "#ffbd2e", GRN = "#27c93f"; // 신호등

const fmtTok = (n) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
};
const fmtUsd = (n) => "$" + (n ?? 0).toFixed(2);

// 막대: 두 도구 상대 비율
const cT = usage.claude?.totalTokens || 0;
const xT = usage.codex?.totalTokens || 0;
const max = Math.max(cT, xT, 1);
const BAR_W = 300;
const cW = Math.round((cT / max) * BAR_W);
const xW = Math.round((xT / max) * BAR_W);

const bar = (x, y, w, filledW, label, tokens, color) => `
  <text x="${x}" y="${y - 6}" class="lbl">${label}</text>
  <rect x="${x}" y="${y}" width="${w}" height="14" rx="3" fill="#161b22"/>
  <rect x="${x}" y="${y}" width="${filledW}" height="14" rx="3" fill="${color}"/>
  <text x="${x + w + 12}" y="${y + 11}" class="val">${fmtTok(tokens)}</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="270" viewBox="0 0 640 270" font-family="'Fira Code','JetBrains Mono',monospace">
  <defs>
    <style>
      .lbl{fill:${MUTED};font-size:12px}
      .val{fill:${GREEN};font-size:13px;font-weight:600}
      .k{fill:${MUTED};font-size:12px}
      .v{fill:#e6edf3;font-size:12px;font-weight:600}
      .title{fill:${GREEN};font-size:13px;font-weight:700}
      .dim{fill:${MUTED};font-size:11px}
    </style>
  </defs>
  <rect x="1" y="1" width="638" height="268" rx="10" fill="${BG}" stroke="#30363d"/>
  <!-- title bar -->
  <rect x="1" y="1" width="638" height="34" rx="10" fill="${PANEL}"/>
  <rect x="1" y="20" width="638" height="15" fill="${PANEL}"/>
  <circle cx="22" cy="18" r="6" fill="${RED}"/>
  <circle cx="42" cy="18" r="6" fill="${YEL}"/>
  <circle cx="62" cy="18" r="6" fill="${GRN}"/>
  <text x="320" y="22" text-anchor="middle" class="dim">seok@dev — ai-usage --stats</text>

  <text x="24" y="62" class="title">$ ai-usage --breakdown</text>

  ${bar(24, 96, BAR_W, cW, "Claude Code", cT, GREEN)}
  ${bar(24, 138, BAR_W, xW, "Codex CLI", xT, "#58a6ff")}

  <!-- 우측 요약 패널 -->
  <line x1="410" y1="80" x2="410" y2="200" stroke="#30363d"/>
  <text x="432" y="92"  class="k">total_tokens : <tspan class="v">${fmtTok(usage.combined?.totalTokens || 0)}</tspan></text>
  <text x="432" y="114" class="k">this_month   : <tspan class="v">${fmtTok(usage.combined?.monthTokens || 0)}</tspan></text>
  <text x="432" y="136" class="k">est_cost     : <tspan class="v">${fmtUsd(usage.combined?.cost)}</tspan></text>
  <text x="432" y="158" class="k">top_model    :</text>
  <text x="432" y="176" class="v">${(usage.claude?.topModel || "-")}</text>
  <text x="432" y="192" class="dim">codex: ${(usage.codex?.topModel || "-")}</text>

  <line x1="24" y1="222" x2="616" y2="222" stroke="#30363d"/>
  <text x="24"  y="244" class="dim">daily_avg  claude ${fmtTok(usage.claude?.dailyAvg || 0)}  ·  codex ${fmtTok(usage.codex?.dailyAvg || 0)}</text>
  <text x="616" y="244" text-anchor="end" class="dim">updated ${usage.updatedAt}</text>
</svg>`;

mkdirSync(ROOT + "assets", { recursive: true });
writeFileSync(ROOT + "assets/ai-usage.svg", svg);

// shields.io endpoint 뱃지
const badge = (label, tokens) => ({
  schemaVersion: 1,
  label,
  message: fmtTok(tokens) + " tokens",
  color: "00FF41",
});
writeFileSync(ROOT + "data/badge-claude.json", JSON.stringify(badge("Claude", cT)));
writeFileSync(ROOT + "data/badge-codex.json", JSON.stringify(badge("Codex", xT)));

console.log("rendered: assets/ai-usage.svg, data/badge-claude.json, data/badge-codex.json");
