import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { h, type Component } from 'vue'
import { financeSummary, parcelStatus } from '../application/financeDetail'
import FinanceDetailPage from '../pages/FinanceDetailPage.vue'
import ChargesPage from '../pages/ChargesPage.vue'
import RecordsTable from '../components/RecordsTable.vue'
import { Select } from '@/components/ui/select'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/utils/axios', () => ({ default: http }))
vi.mock('@/stores/ui/uiStore', () => ({
  useUiStore: () => ({ usuarioLogged: { id: 1, permissao: 'admin' } }),
}))
const fixture = () => ({
  id: 5,
  Uid: 'FIN_TESTE',
  descricao: 'Compra de exemplo',
  tipo: 'DESPESA',
  status: 'PARCIAL',
  valorTotal: '420',
  valorBruto: '450',
  desconto: '30',
  valorEntrada: '50',
  dataLancamento: '2026-10-27T12:00:00',
  createdAt: '2026-10-27T12:00:00',
  formaPagamento: 'DEPOSITO',
  contasFinanceiroId: 2,
  ContasFinanceiro: { id: 2, nome: 'Conta principal' },
  categoria: { nome: 'Equipamentos' },
  clienteId: 7,
  cliente: { id: 7, nome: 'Fornecedor de exemplo' },
  vendaId: 12,
  recorrencia: {
    ativo: true,
    frequencia: 'MENSAL',
    valorParcela: '50',
    proximoVencimento: '2099-11-27T12:00:00',
    geracaoAutomatica: false,
  },
  parcelas: [
    {
      id: 8,
      numero: 1,
      valor: '80',
      valorPago: '80',
      pago: true,
      vencimento: '2026-10-27T12:00:00',
      dataPagamento: '2026-10-27T12:00:00',
      formaPagamento: 'DEPOSITO',
      ContaFinanceira: { nome: 'Conta do pagamento' },
    },
    { id: 9, numero: 2, valor: '140', pago: false, vencimento: '2020-01-01T12:00:00' },
    {
      id: 10,
      numero: 3,
      valor: '200',
      pago: false,
      vencimento: '2099-01-01T12:00:00',
      CobrancasFinanceiras: [
        {
          id: 40,
          Uid: 'COB_TESTE',
          status: 'PENDENTE',
          valor: 200,
          externalLink: 'javascript:alert(1)',
        },
      ],
    },
    {
      id: 11,
      numero: 4,
      valor: '999',
      pago: false,
      ignorado: true,
      vencimento: '2020-01-01T12:00:00',
    },
    { id: 12, numero: 5, valor: '800', pago: true, ignorado: true },
  ],
})
describe('resumo do lançamento', () => {
  it('soma parcelas pagas, abertas e vencidas sem duplicar entrada ou saldo parcial', () => {
    expect(financeSummary(fixture(), new Date(2026, 9, 27, 15))).toMatchObject({
      paid: 80,
      pending: 340,
      overdue: 140,
      paidCount: 1,
      pendingCount: 2,
      overdueCount: 1,
      ignoredCount: 2,
      progress: 19,
      next: { id: 9 },
    })
  })
  it('não considera parcelas ignoradas ou lançamentos ignorados nos totais', () => {
    expect(financeSummary({ ...fixture(), ignorado: true })).toMatchObject({
      paid: 0,
      pending: 0,
      overdue: 0,
      ignoredCount: 5,
      progress: 0,
    })
  })
  it('compara o dia do vencimento, sem marcar a parcela de hoje como atrasada', () => {
    expect(parcelStatus({ pago: false, vencimento: '2026-10-27' }, new Date(2026, 9, 27, 23))).toBe(
      'PENDENTE',
    )
    expect(parcelStatus({ pago: true, vencimento: '2020-01-01' })).toBe('PAGO')
  })
  it('soma centavos e usa o valor pago real, preservando zero explícito', () => {
    expect(
      financeSummary({
        parcelas: [
          { valor: '0.1', pago: false },
          { valor: '0.2', pago: false },
          { valor: 10, valorPago: 0, pago: true },
        ],
      }),
    ).toMatchObject({ paid: 0, pending: 0.3 })
  })
})
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.resetAllMocks()
  http.get.mockImplementation(async (path: string) => ({
    data: path.endsWith('/opcoes')
      ? { results: [{ id: 2, label: 'Conta principal' }], hasMore: false }
      : { data: fixture() },
  }))
  http.post.mockResolvedValue({ data: { data: {} } })
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
async function open(
  component: Component = FinanceDetailPage,
  path = '/modofacil/financeiro/lancamentos/5',
  pattern = '/modofacil/financeiro/lancamentos/:id',
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: pattern, component },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  const workspace = createModalWorkspace(() => true)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      attachTo: document.body,
      global: { plugins: [router], provide: { [modalWorkspaceKey as symbol]: workspace } },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, workspace }
}
describe('detalhes e navegação das parcelas', () => {
  it('mostra dados do cadastro, vínculos, pagamento real e recorrência', async () => {
    const { wrapper: w } = await open()
    expect(w.text()).toContain('Fornecedor de exemplo')
    expect(w.text()).toContain('Conta do pagamento')
    expect(w.text()).toContain('Depósito')
    expect(w.text()).toContain('Desconto')
    expect(w.text()).toContain('Mensal')
    expect(w.text()).toContain('COB_TESTE')
    expect(w.find('[href="/modofacil/vendas/12"]').exists()).toBe(true)
    expect(w.find('[href^="javascript:"]').exists()).toBe(false)
    expect(w.get('[role=progressbar]').attributes('aria-valuenow')).toBe('19')
  })
  it('filtra e pagina somente as parcelas sem alterar o resumo do lançamento', async () => {
    const data = fixture()
    data.parcelas = Array.from({ length: 23 }, (_, index) => ({
      id: index + 1,
      numero: index + 1,
      valor: '10',
      pago: false,
      vencimento: '2099-01-01',
    }))
    http.get.mockResolvedValue({ data: { data } })
    const { wrapper: w } = await open()
    const table = () =>
      w
        .findAllComponents(RecordsTable)
        .find((c) => c.props('caption') === 'Parcelas do lançamento')!
    expect(table().props('rows')).toHaveLength(10)
    await w.get('[aria-label="Próxima página"]').trigger('click')
    expect(table().props('rows')[0].numero).toBe(11)
    await w.get('input[type=search]').setValue('23')
    expect(
      table()
        .props('rows')
        .map((row: any) => row.numero),
    ).toEqual([23])
    await w.get('input[type=search]').setValue('')
    w.getComponent({ name: 'FormSelect' })
      .getComponent(Select)
      .vm.$emit('update:modelValue', JSON.stringify('PAGO'))
    await flushPromises()
    expect(table().props('rows')).toEqual([])
    expect(w.text()).toContain('Nenhuma parcela encontrada.')
    expect(w.text()).toContain('23 parcela(s) em aberto')
  })
  it('o menu da linha abre a edição da parcela correta', async () => {
    const { wrapper: w, workspace } = await open()
    await w.findAll('[aria-label="Ações da parcela 2"]')[0]!.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    const edit = Array.from(document.querySelectorAll<HTMLElement>('[role=menuitem]')).find((el) =>
      el.textContent?.includes('Editar parcela'),
    )!
    expect(edit).toBeDefined()
    edit.click()
    await flushPromises()
    expect(workspace.current.value?.target).toMatchObject({
      form: 'financeiro-parcela',
      params: { id: 5, parcelaId: 9 },
    })
  })
  it('mostra erro explícito se a API não encontrar o lançamento', async () => {
    http.get.mockResolvedValue({ data: { data: null } })
    const { wrapper: w } = await open()
    expect(w.text()).toContain('Lançamento não encontrado.')
    expect(w.findComponent(RecordsTable).exists()).toBe(false)
  })
})

describe('cobranças na tabela padronizada', () => {
  it('mantém o código Pix consultável e pede confirmação antes de cancelar a cobrança', async () => {
    http.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 40,
            Uid: 'COB_TESTE',
            status: 'PENDENTE',
            valor: 50,
            pixCopiaCola: 'codigo-pix-ficticio',
            dataVencimento: '2099-01-01T12:00:00',
          },
        ],
      },
    })
    const { wrapper: w } = await open(
      ChargesPage,
      '/modofacil/financeiro/cobrancas',
      '/modofacil/financeiro/cobrancas',
    )
    await w
      .findAll('button')
      .find((button) => button.text() === 'Cancelar cobrança')!
      .trigger('click')
    await flushPromises()
    expect(document.querySelector('[role=dialog]')?.textContent).toContain(
      'Confirmar cancelamento no gateway',
    )
    expect(http.post).not.toHaveBeenCalled()
    Array.from(document.querySelectorAll<HTMLButtonElement>('[role=dialog] button'))
      .find((button) => button.textContent?.trim() === 'Voltar')!
      .click()
    await flushPromises()
    await w
      .findAll('button')
      .find((button) => button.text() === 'Código Pix')!
      .trigger('click')
    await flushPromises()
    expect(document.querySelector<HTMLTextAreaElement>('[role=dialog] textarea')?.value).toBe(
      'codigo-pix-ficticio',
    )
    expect(document.querySelector<HTMLTextAreaElement>('[role=dialog] textarea')?.readOnly).toBe(
      true,
    )
    expect(http.post).not.toHaveBeenCalled()
  })
})
