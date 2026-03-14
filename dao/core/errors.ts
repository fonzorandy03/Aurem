/**
 * Typed error classes for the DAO layer.
 *
 * All errors carry:
 *   - message       human-readable description
 *   - statusCode    HTTP-like code for upstream mapping
 *   - requestId     correlation ID for log tracing
 *   - graphqlErrors raw GraphQL error array (if available)
 */

export class ShopifyAdminError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly requestId: string,
    public readonly graphqlErrors?: unknown[],
  ) {
    super(message)
    this.name = 'ShopifyAdminError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`)
    this.name = 'NotFoundError'
  }
}

export class WebhookVerificationError extends Error {
  constructor(message = 'Invalid webhook signature') {
    super(message)
    this.name = 'WebhookVerificationError'
  }
}

// ─── Structured error response for API routes ─────────────────────────────────

export interface ErrorResponse {
  success: false
  error: {
    type: string
    message: string
    requestId?: string
    field?: string
  }
}

export function toErrorResponse(err: unknown, requestId?: string): ErrorResponse {
  if (err instanceof ValidationError) {
    return {
      success: false,
      error: { type: 'ValidationError', message: err.message, field: err.field, requestId },
    }
  }
  if (err instanceof NotFoundError) {
    return {
      success: false,
      error: { type: 'NotFoundError', message: err.message, requestId },
    }
  }
  if (err instanceof ShopifyAdminError) {
    return {
      success: false,
      error: { type: 'ShopifyAdminError', message: err.message, requestId: err.requestId },
    }
  }
  return {
    success: false,
    error: {
      type: 'InternalError',
      message: 'An unexpected error occurred',
      requestId,
    },
  }
}
