export function buildPublicMenuUrl(origin: string, slug: string) {
  const normalizedOrigin = origin.replace(/\/$/, '')
  return `${normalizedOrigin}/restaurante/${encodeURIComponent(slug.trim())}`
}
