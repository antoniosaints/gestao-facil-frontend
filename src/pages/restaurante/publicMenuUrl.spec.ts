import { describe, expect, it } from 'vitest'
import { buildPublicMenuUrl } from './publicMenuUrl'

describe('buildPublicMenuUrl', () => {
  it('monta o link publico do cardapio sem exigir composicao manual', () => {
    expect(buildPublicMenuUrl('https://app.exemplo.com', 'minha-pizzaria')).toBe(
      'https://app.exemplo.com/restaurante/minha-pizzaria',
    )
  })

  it('codifica o slug antes de inserir na URL', () => {
    expect(buildPublicMenuUrl('https://app.exemplo.com/', ' loja central ')).toBe(
      'https://app.exemplo.com/restaurante/loja%20central',
    )
  })
})
