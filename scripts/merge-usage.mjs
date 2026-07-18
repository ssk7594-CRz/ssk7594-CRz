#!/usr/bin/env node
// merge-usage.mjs
// ccusage(Claude) + @ccusage/codex(Codex) 의 --json 출력을 받아
// 프로필용 통합 스키마(data/usage.json)로 정규화한다.
//
// 사용: node scripts/merge-usage.mjs --claude '<json>' --codex '<json>'
// ccusage 출력 스키마는 버전에 따라 달라질 수 있어 방어적으로 파싱한다.

function argVal(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : "{}";
}
function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

// ccusage 계열은 보통 { daily: [...], totals: {...} } 또는 배열 형태.
// tokens 합계를 최대한 유연하게 뽑아낸다.
function extract(raw) {
  const data = safeParse(typeof raw === "string" ? raw : JSON.stringify(raw));

  const pickNum = (o, keys) => {
    for (const k of keys) {
      if (o && typeof o[k] === "number") return o[k];
    }
    return 0;
  };

  // totals 후보
  const totals = data.totals || data.total || {};
  const rows = data.daily || data.days || data.sessions || (Array.isArray(data) ? data : []);

  let totalTokens = pickNum(totals, ["totalTokens", "total_tokens", "tokens"]);
  let cost = pickNum(totals, ["totalCost", "total_cost", "costUSD", "cost"]);

  // totals 가 없으면 rows 합산
  if (!totalTokens && Array.isArray(rows)) {
    for (const r of rows) {
      totalTokens += pickNum(r, ["totalTokens", "total_tokens", "tokens"]);
      cost += pickNum(r, ["totalCost", "total_cost", "costUSD", "cost"]);
    }
  }

  // 이번 달 합계
  const ym = new Date().toISOString().slice(0, 7); // YYYY-MM
  let monthTokens = 0, monthCost = 0;
  if (Array.isArray(rows)) {
    for (const r of rows) {
      const d = r.date || r.day || r.timestamp || "";
      if (String(d).startsWith(ym)) {
        monthTokens += pickNum(r, ["totalTokens", "total_tokens", "tokens"]);
        monthCost += pickNum(r, ["totalCost", "total_cost", "costUSD", "cost"]);
      }
    }
  }

  // 최다 사용 모델
  let topModel = "";
  const modelAgg = {};
  if (Array.isArray(rows)) {
    for (const r of rows) {
      const models = r.models || r.modelBreakdowns || [];
      if (Array.isArray(models)) {
        for (const m of models) {
          const name = m.model || m.name || "";
          modelAgg[name] = (modelAgg[name] || 0) + pickNum(m, ["totalTokens", "total_tokens", "tokens"]);
        }
      }
    }
    topModel = Object.entries(modelAgg).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }

  const days = Array.isArray(rows) ? rows.length : 0;
  return {
    totalTokens,
    monthTokens,
    cost: Math.round(cost * 100) / 100,
    monthCost: Math.round(monthCost * 100) / 100,
    dailyAvg: days ? Math.round(totalTokens / days) : 0,
    topModel,
  };
}

const claude = extract(argVal("--claude"));
const codex = extract(argVal("--codex"));

const out = {
  updatedAt: new Date().toISOString().slice(0, 10),
  claude,
  codex,
  combined: {
    totalTokens: claude.totalTokens + codex.totalTokens,
    monthTokens: claude.monthTokens + codex.monthTokens,
    cost: Math.round((claude.cost + codex.cost) * 100) / 100,
  },
};

process.stdout.write(JSON.stringify(out, null, 2) + "\n");
