"use strict";

const { performance } = require("node:perf_hooks");

const baseUrl = (process.env.PUBLIC_APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010").replace(/\/$/, "");
const paths = (process.env.PERF_PATHS || "/,/live,/fixtures,/results,/news,/venues,/sportsbarz,/gfp,/local-leagues/pool,/local-leagues/darts")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);

async function measure(path) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  const body = await response.text();
  const ms = Math.round(performance.now() - started);
  return {
    path,
    status: response.status,
    ms,
    bytes: Buffer.byteLength(body),
    ok: response.status >= 200 && response.status < 400 && ms <= Number(process.env.PERF_MAX_MS || 2500),
  };
}

async function main() {
  const rows = [];
  for (const path of paths) rows.push(await measure(path).catch((error) => ({ path, ok: false, error: error.message })));
  const ok = rows.every((row) => row.ok);
  console.log(JSON.stringify({ ok, checkedAt: new Date().toISOString(), baseUrl, rows }, null, 2));
  if (!ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});

