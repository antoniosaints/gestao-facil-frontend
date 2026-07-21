import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ModalDetalhesCaixa from './ModalDetalhesCaixa.vue'

type CaixaProp = InstanceType<typeof ModalDetalhesCaixa>['$props']['caixa']

// `Intl.NumberFormat('pt-BR')` separa "R$" do valor com espaço não-quebrável (U+00A0),
// que não casa com o espaço comum digitado nas asserções.
const semNbsp = (valor: string) => valor.replace(/ /g, ' ')

function montar(caixa: CaixaProp) {
  return mount(ModalDetalhesCaixa, {
    props: { open: true, caixa },
    global: {
      stubs: {
        ModalView: { template: '<div><slot /></div>' },
      },
    },
  })
}

function construirCaixa(
  overrides: {
    saldoInicial?: number
    saldoContado?: number | null
    saldoEsperado?: number
    porMetodo?: Record<string, number>
    totalSangrias?: number
    totalReforcos?: number
    status?: 'ABERTO' | 'FECHADO'
    fechadoEm?: string | null
  } = {},
) {
  const {
    saldoInicial = 100,
    saldoContado = null,
    porMetodo = { DINHEIRO: 500, PIX: 300 },
    totalSangrias = 200,
    totalReforcos = 50,
    status = 'FECHADO',
    fechadoEm = '2026-07-21T18:00:00.000Z',
  } = overrides

  const saldoEsperado =
    overrides.saldoEsperado ??
    saldoInicial + (porMetodo.DINHEIRO || 0) + totalReforcos - totalSangrias

  return {
    caixa: {
      id: 7,
      codigo: 'CAI_007',
      status,
      saldoInicial,
      saldoEsperado,
      saldoContado,
      abertoEm: '2026-07-21T11:00:00.000Z',
      fechadoEm,
      abertoPor: { id: 1, nome: 'Ana' },
      fechadoPor: fechadoEm ? { id: 2, nome: 'Bruno' } : null,
      operadores: [],
    },
    resumo: {
      totalVendido: Object.values(porMetodo).reduce((acc, v) => acc + v, 0),
      totalVendas: 2,
      totalSangrias,
      totalReforcos,
      saldoEsperado,
      saldoInicial,
      saldoContado,
      diferenca: saldoContado === null ? 0 : saldoContado - saldoEsperado,
      porMetodo,
      caixasAbertos: 0,
      caixasFechados: 1,
    },
    produtosMaisVendidos: [{ nome: 'Café', quantidade: 4, total: 80 }],
    movimentos: [],
    vendas: [],
  } as unknown as CaixaProp
}

describe('ModalDetalhesCaixa', () => {
  it('monta o extrato da gaveta usando só as vendas em dinheiro', () => {
    // Esperado = 100 inicial + 500 dinheiro + 50 reforços - 200 sangrias = 450.
    const wrapper = montar(construirCaixa())
    const extrato = semNbsp(wrapper.get('[data-testid="extrato-gaveta"]').text())

    expect(extrato).toContain('Vendas em dinheiro')
    expect(extrato).toContain('R$ 500,00')
    expect(extrato).toContain('Esperado na gaveta')
    expect(extrato).toContain('R$ 450,00')
    // Os 300 do PIX não entram na gaveta: o total vendido (800) não pode
    // aparecer no extrato como se fosse espécie.
    expect(extrato).not.toContain('R$ 800,00')
    expect(extrato).not.toContain('R$ 300,00')
  })

  it('nao inventa linha de ajuste quando o extrato ja fecha', () => {
    const wrapper = montar(construirCaixa())
    expect(wrapper.text()).not.toContain('Estornos e ajustes')
  })

  it('revela estornos quando o saldo esperado nao bate com o extrato', () => {
    // saldoEsperado autoritativo de 430 contra 450 derivados: 20 de estorno.
    const wrapper = montar(construirCaixa({ saldoEsperado: 430 }))
    const extrato = semNbsp(wrapper.get('[data-testid="extrato-gaveta"]').text())

    expect(extrato).toContain('Estornos e ajustes')
    expect(extrato).toContain('- R$ 20,00')
    expect(extrato).toContain('R$ 430,00')
  })

  it('acusa falta quando contaram menos que o esperado', () => {
    const wrapper = montar(construirCaixa({ saldoContado: 430 }))
    const conteudo = semNbsp(wrapper.text())

    expect(conteudo).toContain('Falta na gaveta')
    expect(conteudo).toContain('- R$ 20,00')
  })

  it('acusa sobra quando contaram mais que o esperado', () => {
    const wrapper = montar(construirCaixa({ saldoContado: 475 }))
    const conteudo = semNbsp(wrapper.text())

    expect(conteudo).toContain('Sobra na gaveta')
    expect(conteudo).toContain('+ R$ 25,00')
  })

  it('confirma o caixa conferido quando bate exatamente', () => {
    const wrapper = montar(construirCaixa({ saldoContado: 450 }))
    expect(wrapper.text()).toContain('Caixa conferido')
  })

  it('trata caixa aberto como conferencia pendente, nao como diferenca zero', () => {
    const wrapper = montar(
      construirCaixa({ status: 'ABERTO', fechadoEm: null, saldoContado: null }),
    )
    const conteudo = wrapper.text()

    expect(conteudo).toContain('Conferência pendente')
    expect(conteudo).toContain('Em andamento')
    expect(conteudo).not.toContain('Caixa conferido')
  })

  it('emite exportar-pdf com o id do caixa aberto no modal', async () => {
    const wrapper = montar(construirCaixa())
    const botaoPdf = wrapper
      .findAll('button')
      .find((botao) => botao.text().includes('Exportar PDF'))

    await botaoPdf?.trigger('click')
    expect(wrapper.emitted('exportar-pdf')?.[0]).toEqual([7])
  })
})
