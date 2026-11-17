import type { InputHTMLAttributes } from 'vue'

/** Keep native number values, validation and decimal precision intact. */
export function resolveInputMode(attrs: Record<string, unknown>): InputHTMLAttributes['inputmode'] {
  if (attrs.inputmode != null) return String(attrs.inputmode) as InputHTMLAttributes['inputmode']
  const type = String(attrs.type ?? 'text').toLowerCase()
  if (type === 'number') {
    const step = attrs.step == null ? 1 : Number(attrs.step)
    // Signed fields need the decimal keyboard (numeric keyboards often omit minus).
    return attrs.step === 'any' ||
      !Number.isInteger(step) ||
      attrs.min == null ||
      Number(attrs.min) < 0
      ? 'decimal'
      : 'numeric'
  }
  if (type === 'tel' || type === 'email' || type === 'url' || type === 'search') return type
  return undefined
}
