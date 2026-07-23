// Contatos de suporte exibidos no passo final do tour de boas-vindas (e onde mais
// for útil). Edite os valores abaixo com os canais reais do suporte.
//   - whatsapp: apenas dígitos, com DDI+DDD (ex.: '5511999999999'). Usado para montar
//     o link https://wa.me/<numero>.
//   - email: endereço de suporte. Usado para montar o link mailto:.
export const SUPPORT = {
  whatsapp: '5599999999999',
  email: 'suporte@gestaofacil.com.br',
} as const

export const supportWhatsappUrl = (mensagem?: string) => {
  const base = `https://wa.me/${SUPPORT.whatsapp.replace(/\D/g, '')}`
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base
}

export const supportEmailUrl = (assunto?: string) => {
  const base = `mailto:${SUPPORT.email}`
  return assunto ? `${base}?subject=${encodeURIComponent(assunto)}` : base
}
