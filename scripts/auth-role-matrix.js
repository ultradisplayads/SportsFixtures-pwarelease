"use strict";

const baseUrl = (process.env.PUBLIC_APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010").replace(/\/$/, "");

const requiredFlows = [
  { area: "web", flow: "email/password register", endpoint: "/api/auth/register", method: "POST", proof: "manual test user required" },
  { area: "web", flow: "email/password login", endpoint: "/api/auth/login", method: "POST", proof: "manual test user required" },
  { area: "web", flow: "current user", endpoint: "/api/auth/me", method: "GET", proof: "should return 401 anonymous, 200 signed-in" },
  { area: "pwa", flow: "Google callback route", endpoint: "/api/auth/google/callback", method: "GET", proof: "OAuth env and provider account required" },
  { area: "pwa", flow: "Facebook callback route", endpoint: "/api/auth/facebook/callback", method: "GET", proof: "OAuth env and provider account required" },
  { area: "venue", flow: "venue owner signup route", endpoint: "/api/venues/owner-signup", method: "POST", proof: "test venue payload required" },
  { area: "admin", flow: "admin measurement guarded route", endpoint: "/api/internal/measurement/sessions-totals", method: "GET", proof: "should return 401 anonymous" },
];

async function checkRoute(item) {
  const response = await fetch(`${baseUrl}${item.endpoint}`, { method: item.method });
  return {
    ...item,
    anonymousStatus: response.status,
    anonymousGuardLooksOk: item.area === "admin" ? response.status === 401 || response.status === 403 : true,
  };
}

async function main() {
  const rows = [];
  for (const flow of requiredFlows) rows.push(await checkRoute(flow).catch((error) => ({ ...flow, error: error.message })));
  const adminGuardOk = rows.filter((row) => row.area === "admin").every((row) => row.anonymousGuardLooksOk);
  console.log(JSON.stringify({ ok: adminGuardOk, checkedAt: new Date().toISOString(), baseUrl, rows }, null, 2));
  if (!adminGuardOk) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});

