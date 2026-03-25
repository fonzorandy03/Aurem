import { NextResponse } from 'next/server'

type BucketEntry = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Map<string, BucketEntry>>()

function getBucket(bucket: string): Map<string, BucketEntry> {
  const existing = buckets.get(bucket)
  if (existing) return existing

  const created = new Map<string, BucketEntry>()
  buckets.set(bucket, created)
  return created
}

export function getClientIp(req: { headers: Headers }): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const candidate = forwarded.split(',')[0]?.trim()
    if (candidate) return candidate
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

export function consumeRateLimit({
  bucket,
  key,
  limit,
  windowMs,
}: {
  bucket: string
  key: string
  limit: number
  windowMs: number
}): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const entries = getBucket(bucket)
  const entry = entries.get(key)

  if (!entry || now >= entry.resetAt) {
    entries.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    return { ok: false, retryAfterSeconds }
  }

  entry.count += 1
  return { ok: true, retryAfterSeconds: 0 }
}

export function tooManyRequestsResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
    },
  )
}

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
