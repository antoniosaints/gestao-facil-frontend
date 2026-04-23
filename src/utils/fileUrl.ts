import { env } from '@/utils/dotenv'

function appendCacheBuster(url: string, bustCache: boolean) {
  if (!bustCache) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_t=${Date.now()}`
}

export function resolveFileUrl(pathOrUrl?: string | null, options?: { bustCache?: boolean; fallback?: string }) {
  const fallback = options?.fallback ?? '/imgs/logo.png'
  const bustCache = options?.bustCache ?? false

  if (!pathOrUrl) {
    return appendCacheBuster(fallback, bustCache)
  }

  if (/^(data:|blob:|https?:\/\/)/i.test(pathOrUrl)) {
    return appendCacheBuster(pathOrUrl, bustCache)
  }

  const normalized = pathOrUrl.replace(/^\/+/, '')
  const base = env.VITE_BACKEND_URL?.replace(/\/+$/, '') || ''
  const resolved = base ? `${base}/${normalized}` : `/${normalized}`
  return appendCacheBuster(resolved, bustCache)
}
