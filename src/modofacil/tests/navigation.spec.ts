import { describe, it, expect, vi, beforeEach } from 'vitest'
import { experienceDestination } from '../application/navigation'
import { changedProductFields } from '../application/productPayload'
import { decimal } from '../application/format'
import type { RouteLocationNormalized } from 'vue-router'
const route = (name: string, path: string, extra = {}) =>
  ({ name, path, meta: {}, params: {}, query: {}, ...extra }) as unknown as RouteLocationNormalized
const normal = { modo: 'NORMAL' as const, versao: 0, podeAlterar: false },
  easy = { ...normal, modo: 'FACIL' as const }
describe('experience policy', () => {
  it('preserva todas as entradas Normal e não habilita Fácil pela URL', () => {
    expect(experienceDestination(route('home', '/'), normal)).toBe(true)
    expect(
      experienceDestination(route('modofacil-produtos', '/modofacil/produtos'), normal),
    ).toEqual({ name: 'home', replace: true })
  })
  it('mantém recuperação administrativa em ambas as experiências', () => {
    for (const config of [normal, easy])
      for (const path of ['/modofacil/configuracoes', '/configuracoes'])
        expect(experienceDestination(route('settings', path), config)).toBe(true)
  })
  it('não interfere com rotas públicas, CEO, assinatura ou PDV', () => {
    for (const path of ['/admin/assinantes', '/assinatura/resumo', '/vendas/pdv'])
      expect(experienceDestination(route('home', path), easy)).toBe(true)
    expect(experienceDestination(route('home', '/site', { meta: { isPublic: true } }), easy)).toBe(
      true,
    )
  })
  it('preserva IDs/query e não redireciona o próprio destino', () => {
    expect(
      experienceDestination(
        route('clientes-detalhes', '/clientes/17', { params: { id: '17' }, query: { page: '2' } }),
        easy,
      ),
    ).toEqual({ path: '/modofacil/pessoas/17', query: { page: '2' }, replace: true })
    expect(experienceDestination(route('modofacil-inicio', '/modofacil'), easy)).toBe(true)
  })
  it('não inventa modo em falha nem intercepta módulo sem equivalente', () => {
    expect(experienceDestination(route('home', '/'), null)).toBe(true)
    expect(experienceDestination(route('ourive-painel', '/ourive'), easy)).toEqual({
      path: '/modofacil/recursos/ourives',
      replace: true,
    })
  })
})
describe('quantidades e atualização básica', () => {
  it('aceita pt-BR, custo zero e frações de estoque sem arredondar', () => {
    expect(decimal('0,250', 3)).toBe(0.25)
    expect(decimal('35,90')).toBe(35.9)
    expect(decimal('0')).toBe(0)
  })
  it('recusa ambiguidade, excesso de precisão e negativos', () => {
    for (const v of ['1.000,50', '-1', '1,234', '', 'abc']) expect(() => decimal(v)).toThrow()
  })
  it('envia somente o campo editado e nunca estoque ou campos avançados', () => {
    const original = {
      nome: 'Café',
      categoriaId: null,
      unidade: 'kg',
      preco: 30,
      precoCompra: null,
      estoque: 10,
      minimo: 1,
      descricao: null,
    }
    expect(changedProductFields({ ...original, preco: 35, estoque: 20 }, original)).toEqual({
      preco: 35,
    })
    expect(changedProductFields(original, original)).toEqual({})
  })
})

describe('contrato de itens de venda/OS', () => {
  it('aceita inteiros e rejeita fracionamento que o domínio ainda não suporta', async () => {
    const { validateItems } = await import('../application/items')
    expect(() => validateItems([{ quantidade: 1, preco: 35.9 }])).not.toThrow()
    expect(() => validateItems([{ quantidade: 0.25, preco: 35.9 }])).toThrow('quantidades inteiras')
  })
})

describe('continuidade explícita de módulos setoriais', () => {
  it('continua aplicando o aviso quando não há escolha explícita', () => {
    expect(experienceDestination(route('arena', '/arena'), easy)).toEqual({
      path: '/modofacil/recursos/arena',
      replace: true,
    })
  })
  it('autoriza continuidade apenas no módulo escolhido, sem afetar operações básicas', () => {
    expect(experienceDestination(route('arena', '/arena/quadras'), easy, 'arena')).toBe(true)
    expect(experienceDestination(route('ourive', '/ourive'), easy, 'arena')).toEqual({
      path: '/modofacil/recursos/ourives',
      replace: true,
    })
    expect(experienceDestination(route('produtos-home', '/produtos'), easy, 'arena')).toEqual({
      path: '/modofacil/produtos',
      query: {},
      replace: true,
    })
  })
})
