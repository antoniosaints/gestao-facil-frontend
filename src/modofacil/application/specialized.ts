/** Explicit continuity for active modules whose own simplified journey is pending. */
export const specializedModules: Record<string, { label: string; path: string; prefix: string }> = {
  'restaurante-delivery': { label: 'Restaurante', path: '/restaurante', prefix: '/restaurante' },
  arena: { label: 'Arena', path: '/arena', prefix: '/arena' },
  reservas: { label: 'Reservas', path: '/reservas', prefix: '/reservas' },
  ourives: { label: 'Ourive', path: '/ourive', prefix: '/ourive' },
  assinaturas: { label: 'Assinaturas', path: '/assinaturas', prefix: '/assinaturas' },
  'loja-virtual': { label: 'Loja virtual', path: '/loja-virtual', prefix: '/loja-virtual' },
  'notas-fiscais': { label: 'Notas fiscais', path: '/notas-fiscais', prefix: '/notas-fiscais' },
  atendimento: { label: 'Atendimento', path: '/atendimento', prefix: '/atendimento' },
  whatsapp: { label: 'WhatsApp', path: '/whatsapp', prefix: '/whatsapp' },
  combos: { label: 'Combos', path: '/produtos/combos', prefix: '/produtos/combos' },
  'core-ia': { label: 'Inteligência artificial', path: '/chat/ia', prefix: '/chat/ia' },
}
export function specializedModule(path: string) {
  return (
    Object.entries(specializedModules).find(
      ([, value]) => path === value.prefix || path.startsWith(value.prefix + '/'),
    )?.[0] || null
  )
}
