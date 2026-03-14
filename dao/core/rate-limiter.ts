/**
 * Token-Bucket Rate Limiter
 *
 * Shopify Admin API quote:
 *   - 1 000 query-cost points / second (leaky bucket)
 *   - Burst up to 10 000 points before throttling
 *
 * This implementation limits raw request count; for granular
 * cost-based throttling, read `extensions.cost` from each
 * response and back off when currentlyAvailable < 200.
 */

interface RateLimiterOptions {
  requestsPerSecond: number
  burstLimit: number
}

export class RateLimiter {
  private tokens: number
  private readonly maxTokens: number
  private readonly refillRate: number   // tokens per ms
  private lastRefill: number
  private queue: Array<() => void> = []

  constructor({ requestsPerSecond, burstLimit }: RateLimiterOptions) {
    this.maxTokens = burstLimit
    this.tokens = burstLimit
    this.refillRate = requestsPerSecond / 1000
    this.lastRefill = Date.now()
  }

  private refill() {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate)
    this.lastRefill = now
  }

  acquire(): Promise<void> {
    this.refill()

    if (this.tokens >= 1) {
      this.tokens -= 1
      return Promise.resolve()
    }

    // Queue request and resolve when a token becomes available
    return new Promise<void>((resolve) => {
      this.queue.push(resolve)
      const tokensNeeded = this.queue.length
      const waitMs = ((tokensNeeded - this.tokens) / this.refillRate)
      setTimeout(() => {
        this.refill()
        const next = this.queue.shift()
        if (next) {
          this.tokens -= 1
          next()
        }
      }, Math.ceil(waitMs))
    })
  }
}
