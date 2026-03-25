export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next) return null
  if (!next.startsWith('/')) return null
  if (next.startsWith('//')) return null
  return next
}

export function buildLoginRedirect(nextPath: string): string {
  const safeNext = sanitizeNextPath(nextPath) ?? '/account'
  return `/login?next=${encodeURIComponent(safeNext)}`
}
