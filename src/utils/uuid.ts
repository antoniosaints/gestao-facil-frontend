/**
 * Gera um UUID v4 de forma segura em qualquer contexto.
 *
 * `crypto.randomUUID()` só existe em contextos seguros (HTTPS ou localhost).
 * Ao acessar o app por um IP de LAN via HTTP (ex.: http://192.168.0.10:5173)
 * ele fica `undefined` e quebra. Aqui usamos `getRandomValues` (disponível
 * também em HTTP) e, no pior caso, um fallback com Math.random.
 */
export function randomUUID(): string {
  const c = globalThis.crypto as Crypto | undefined

  if (typeof c?.randomUUID === 'function') return c.randomUUID()

  if (typeof c?.getRandomValues === 'function') {
    const bytes = c.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // versão 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0
    const v = ch === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
