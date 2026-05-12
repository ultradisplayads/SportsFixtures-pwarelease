"use strict";

const baseUrl = (process.env.PUBLIC_APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010").replace(/\/$/, "");
const secret = process.env.STRAPI_WEBHOOK_SECRET || process.env.SEO_REVALIDATE_SECRET;

if (!secret) {
  throw new Error("STRAPI_WEBHOOK_SECRET or SEO_REVALIDATE_SECRET is required.");
}

async function main() {
  const response = await fetch(`${baseUrl}/api/strapi/revalidate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-strapi-secret": secret,
    },
    body: JSON.stringify({
      event: "entry.publish",
      model: "article",
      entry: { slug: "preprod-webhook-proof" },
      paths: ["/news", "/sitemap.xml", "/llms.txt", "/ai.txt"],
    }),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  console.log(JSON.stringify({ ok: response.ok, status: response.status, body }, null, 2));
  if (!response.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});

