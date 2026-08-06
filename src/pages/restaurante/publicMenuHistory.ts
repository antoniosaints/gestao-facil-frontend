const MAX_TRACKED_ORDERS = 30

export function parseTrackingTokens(raw: string | null | undefined) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(
        parsed.filter(
          (token): token is string => typeof token === 'string' && token.trim().length >= 8,
        ),
      ),
    ].slice(0, MAX_TRACKED_ORDERS)
  } catch {
    return []
  }
}

export function prependTrackingToken(tokens: string[], token: string) {
  return [token, ...tokens.filter((current) => current !== token)].slice(0, MAX_TRACKED_ORDERS)
}
