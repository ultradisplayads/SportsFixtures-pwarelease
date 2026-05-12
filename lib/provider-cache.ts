type ProviderCacheEnvelope<T> = {
  provider: string
  endpointHash: string
  storedAt: number
  expiresAt: number
  data: T
}

type CachedProviderJsonOptions<T> = {
  provider: string
  endpoint: string
  ttlSeconds: number
  staleWhileRevalidateSeconds?: number
  fetcher: () => Promise<T>
  cacheNull?: boolean
}

const memoryCache = new Map<string, ProviderCacheEnvelope<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()
let warnedR2Unavailable = false

function getEnv(name: string): string {
  return process.env[name] || ""
}

function hasR2Config() {
  return Boolean(
    getEnv("CLOUDFLARE_R2_ACCOUNT_ID") &&
    getEnv("CLOUDFLARE_R2_ACCESS_KEY_ID") &&
    getEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY") &&
    getEnv("CLOUDFLARE_R2_BUCKET"),
  )
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  return Array.from(view)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return toHex(digest)
}

async function hmacSha256(key: ArrayBuffer | Uint8Array<ArrayBuffer>, value: string): Promise<Uint8Array<ArrayBuffer>> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value))
  return new Uint8Array(signature) as Uint8Array<ArrayBuffer>
}

async function getSigningKey(secret: string, date: string, region: string, service: string): Promise<Uint8Array<ArrayBuffer>> {
  const dateKey = await hmacSha256(new TextEncoder().encode(`AWS4${secret}`), date)
  const regionKey = await hmacSha256(dateKey, region)
  const serviceKey = await hmacSha256(regionKey, service)
  return hmacSha256(serviceKey, "aws4_request")
}

function r2ObjectUrl(objectKey: string) {
  const accountId = getEnv("CLOUDFLARE_R2_ACCOUNT_ID")
  const bucket = getEnv("CLOUDFLARE_R2_BUCKET")
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/")
  return new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodedKey}`)
}

async function signedR2Fetch(method: "GET" | "PUT", objectKey: string, body = "") {
  const accessKey = getEnv("CLOUDFLARE_R2_ACCESS_KEY_ID")
  const secret = getEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
  const region = "auto"
  const service = "s3"
  const url = r2ObjectUrl(objectKey)
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "")
  const dateStamp = amzDate.slice(0, 8)
  const payloadHash = await sha256Hex(body)
  const canonicalHeaders = [
    `host:${url.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n")
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date"
  const canonicalRequest = [
    method,
    url.pathname,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n")
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n")
  const signingKey = await getSigningKey(secret, dateStamp, region, service)
  const signature = toHex(await hmacSha256(signingKey, stringToSign))
  const headers: Record<string, string> = {
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  }
  if (method === "PUT") headers["Content-Type"] = "application/json"

  return fetch(url.toString(), {
    method,
    headers,
    body: method === "PUT" ? body : undefined,
    cache: "no-store",
  })
}

async function cacheKey(provider: string, endpoint: string): Promise<{ id: string; objectKey: string }> {
  const hash = await sha256Hex(`${provider}:${endpoint}`)
  const prefix = getEnv("CLOUDFLARE_R2_CACHE_PREFIX") || "sportsfixtures-provider-cache"
  return {
    id: `${provider}:${hash}`,
    objectKey: `${prefix}/${provider}/${hash}.json`,
  }
}

async function readR2<T>(objectKey: string): Promise<ProviderCacheEnvelope<T> | null> {
  if (!hasR2Config()) return null
  try {
    const res = await signedR2Fetch("GET", objectKey)
    if (!res.ok) return null
    return (await res.json()) as ProviderCacheEnvelope<T>
  } catch (error) {
    if (!warnedR2Unavailable) {
      console.warn("[provider-cache] Cloudflare R2 cache unavailable; using runtime cache only.", error)
      warnedR2Unavailable = true
    }
    return null
  }
}

async function writeR2<T>(objectKey: string, envelope: ProviderCacheEnvelope<T>): Promise<void> {
  if (!hasR2Config()) return
  try {
    await signedR2Fetch("PUT", objectKey, JSON.stringify(envelope))
  } catch (error) {
    if (!warnedR2Unavailable) {
      console.warn("[provider-cache] Cloudflare R2 cache write failed; using runtime cache only.", error)
      warnedR2Unavailable = true
    }
  }
}

function isFresh<T>(envelope: ProviderCacheEnvelope<T> | undefined | null): boolean {
  return Boolean(envelope && envelope.expiresAt > Date.now())
}

function isStaleButUsable<T>(
  envelope: ProviderCacheEnvelope<T> | undefined | null,
  staleWhileRevalidateSeconds: number,
): boolean {
  if (!envelope || staleWhileRevalidateSeconds <= 0) return false
  return envelope.expiresAt + staleWhileRevalidateSeconds * 1000 > Date.now()
}

function refreshCacheInBackground<T>(
  id: string,
  objectKey: string,
  provider: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  cacheNull: boolean,
) {
  if (inFlight.has(id)) return

  const promise = (async () => {
    const data = await fetcher()
    if (data == null && !cacheNull) return data

    const now = Date.now()
    const envelope: ProviderCacheEnvelope<T> = {
      provider,
      endpointHash: id.split(":").pop() || id,
      storedAt: now,
      expiresAt: now + ttlSeconds * 1000,
      data,
    }
    memoryCache.set(id, envelope)
    await writeR2(objectKey, envelope)
    return data
  })()

  inFlight.set(id, promise)
  promise.finally(() => inFlight.delete(id)).catch(() => {})
}

export async function cachedProviderJson<T>({
  provider,
  endpoint,
  ttlSeconds,
  staleWhileRevalidateSeconds = 0,
  fetcher,
  cacheNull = false,
}: CachedProviderJsonOptions<T>): Promise<T> {
  const { id, objectKey } = await cacheKey(provider, endpoint)
  const memoryHit = memoryCache.get(id) as ProviderCacheEnvelope<T> | undefined
  if (isFresh(memoryHit)) return memoryHit!.data
  if (isStaleButUsable(memoryHit, staleWhileRevalidateSeconds)) {
    refreshCacheInBackground(id, objectKey, provider, ttlSeconds, fetcher, cacheNull)
    return memoryHit!.data
  }

  const existing = inFlight.get(id) as Promise<T> | undefined
  if (existing) return existing

  const promise = (async () => {
    const r2Hit = await readR2<T>(objectKey)
    if (r2Hit && isFresh(r2Hit)) {
      memoryCache.set(id, r2Hit)
      return r2Hit.data
    }
    if (r2Hit && isStaleButUsable(r2Hit, staleWhileRevalidateSeconds)) {
      memoryCache.set(id, r2Hit)
      refreshCacheInBackground(id, objectKey, provider, ttlSeconds, fetcher, cacheNull)
      return r2Hit.data
    }

    const data = await fetcher()
    if (data == null && !cacheNull) return data

    const now = Date.now()
    const envelope: ProviderCacheEnvelope<T> = {
      provider,
      endpointHash: id.split(":").pop() || id,
      storedAt: now,
      expiresAt: now + ttlSeconds * 1000,
      data,
    }
    memoryCache.set(id, envelope)
    await writeR2(objectKey, envelope)
    return data
  })()

  inFlight.set(id, promise)
  try {
    return await promise
  } finally {
    inFlight.delete(id)
  }
}

export function providerCacheStatus() {
  return {
    durable: hasR2Config(),
    runtimeEntries: memoryCache.size,
    inFlight: inFlight.size,
    bucket: getEnv("CLOUDFLARE_R2_BUCKET") || null,
    prefix: getEnv("CLOUDFLARE_R2_CACHE_PREFIX") || "sportsfixtures-provider-cache",
  }
}
