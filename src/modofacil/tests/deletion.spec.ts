import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { h, type Component } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
  page: vi.fn(),
  ui: { usuarioLogged: { permissao: 'admin' } },
}))
vi.mock('../adapters/domain', () => ({ api: { remove: mocks.remove, page: mocks.page } }))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => mocks.ui }))
import DeleteRecord from '../components/DeleteRecord.vue'
import SalesPage from '../pages/SalesPage.vue'
import { errorMessage } from '../application/format'
import { deletionScopeKey } from '../application/deletionScope'
const wrappers: ReturnType<typeof mount>[] = []
const record = () => ({
  id: 7,
  nome: 'Produto exemplo',
  descricao: 'Conta exemplo',
  Uid: 'VEN_TESTE',
  valor: 100,
  valorTotal: 200,
  status: 'PENDENTE',
  faturado: false,
})
async function open(
  props: InstanceType<typeof DeleteRecord>['$props'],
  component?: Component,
  query = '',
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/modofacil/teste',
        component: component || { render: () => h(DeleteRecord, props) },
      },
      { path: '/modofacil/vendas', component: { template: '<div>Lista de vendas</div>' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push('/modofacil/teste' + query)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      global: {
        plugins: [router],
        stubs: {
          ModalView: {
            props: ['title'],
            template:
              '<div role="dialog"><h2>{{ title }}</h2><slot name="header-actions" /><slot /><slot name="footer" /></div>',
          },
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, router }
}
const button = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text().trim() === text)!
beforeEach(() => {
  vi.clearAllMocks()
  mocks.ui.usuarioLogged.permissao = 'admin'
  mocks.remove.mockResolvedValue(undefined)
  mocks.page.mockResolvedValue({ rows: [], pages: 1, total: 0 })
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('exclusões do Modo Fácil', () => {
  it.each([
    ['sale', '/modofacil/vendas/7', 'VEN_TESTE'],
    ['finance', '/modofacil/financeiro/lancamentos/7', 'Conta exemplo'],
    ['product', '/modofacil/produtos/7', 'Produto exemplo'],
    ['service', '/modofacil/servicos/7', 'Produto exemplo'],
    ['person', '/modofacil/pessoas/7', 'Produto exemplo'],
  ] as const)(
    'exclui %s somente após confirmar e usa o endpoint dedicado',
    async (kind, path, identity) => {
      const { wrapper } = await open({ kind, record: record() })
      await button(wrapper, 'Excluir').trigger('click')
      expect(wrapper.get('[role=dialog]').text()).toContain(identity)
      expect(wrapper.get('[role=dialog]').text()).toContain('permanente')
      expect(mocks.remove).not.toHaveBeenCalled()
      await button(wrapper, 'Confirmar exclusão').trigger('click')
      await flushPromises()
      expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(path)
      expect(wrapper.find('[role=dialog]').exists()).toBe(false)
      expect(wrapper.getComponent(DeleteRecord).emitted('deleted')).toHaveLength(1)
    },
  )
  it('cancelar a confirmação não envia a exclusão', async () => {
    const { wrapper } = await open({ kind: 'product', record: record() })
    await button(wrapper, 'Excluir').trigger('click')
    await button(wrapper, 'Voltar').trigger('click')
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(mocks.remove).not.toHaveBeenCalled()
  })
  it.each([
    { status: 'FATURADO', faturado: false },
    { status: 'PENDENTE', faturado: true },
  ])('orienta estorno antes de excluir a venda faturada: %s', async (state) => {
    const { wrapper } = await open({ kind: 'sale', record: { ...record(), ...state } })
    await button(wrapper, 'Excluir').trigger('click')
    expect(wrapper.get('[role=dialog]').text()).toContain('estorne o faturamento')
    expect(button(wrapper, 'Confirmar exclusão')).toBeUndefined()
    expect(mocks.remove).not.toHaveBeenCalled()
  })
  it.each([
    ['sale', 'vendedor'],
    ['finance', 'vendedor'],
    ['product', 'gerente'],
    ['service', 'usuario'],
    ['person', 'usuario'],
  ] as const)('não oferece a exclusão de %s sem a permissão necessária', async (kind, role) => {
    mocks.ui.usuarioLogged.permissao = role
    const { wrapper } = await open({ kind, record: record() })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(mocks.remove).not.toHaveBeenCalled()
  })
  it('mostra a restrição de vínculo retornada pelo servidor sem remover o registro', async () => {
    mocks.remove.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'Este serviço possui vínculos que impedem a exclusão.' },
      },
    })
    const { wrapper } = await open({ kind: 'service', record: record() })
    await button(wrapper, 'Excluir').trigger('click')
    await button(wrapper, 'Confirmar exclusão').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('possui vínculos')
    expect(wrapper.getComponent(DeleteRecord).emitted('deleted')).toBeUndefined()
    expect(button(wrapper, 'Confirmar exclusão').attributes('disabled')).toBeUndefined()
  })
  it('bloqueia duplo clique e repetição após resultado incerto', async () => {
    let reject!: (value: unknown) => void
    mocks.remove.mockReturnValueOnce(
      new Promise((_resolve, fail) => {
        reject = fail
      }),
    )
    const { wrapper, router } = await open({ kind: 'finance', record: record() })
    await button(wrapper, 'Excluir').trigger('click')
    await button(wrapper, 'Confirmar exclusão').trigger('click')
    await button(wrapper, 'Confirmar exclusão').trigger('click')
    expect(mocks.remove).toHaveBeenCalledTimes(1)
    await router.push('/modofacil/vendas')
    expect(router.currentRoute.value.path).toBe('/modofacil/teste')
    reject({ response: { status: 500, data: { message: 'Resposta não confirmada' } } })
    await flushPromises()
    expect(button(wrapper, 'Confirmar exclusão').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[role=dialog]').text()).toContain('resultado da operação')
    await button(wrapper, 'Confirmar exclusão').trigger('click')
    expect(mocks.remove).toHaveBeenCalledTimes(1)
  })
  it('retorna à lista após a exclusão feita nos detalhes', async () => {
    const { wrapper, router } = await open({
      kind: 'sale',
      record: record(),
      redirect: '/modofacil/vendas',
    })
    await button(wrapper, 'Excluir').trigger('click')
    await button(wrapper, 'Confirmar exclusão').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/modofacil/vendas')
  })
  it('as versões desktop e móvel compartilham o bloqueio após resultado incerto', async () => {
    mocks.remove.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Resposta incerta' } },
    })
    const { wrapper } = await open(
      { kind: 'sale', record: record() },
      {
        provide() {
          return { [deletionScopeKey as symbol]: new Map() }
        },
        render: () =>
          h('div', [
            h(DeleteRecord, { kind: 'sale', record: record() }),
            h(DeleteRecord, { kind: 'sale', record: record() }),
          ]),
      },
    )
    await button(wrapper, 'Excluir').trigger('click')
    await button(wrapper, 'Confirmar exclusão').trigger('click')
    await flushPromises()
    await button(wrapper, 'Voltar').trigger('click')
    expect(
      wrapper
        .findAll('button')
        .filter((b) => b.text() === 'Excluir')
        .every((b) => b.attributes('disabled') !== undefined),
    ).toBe(true)
    expect(mocks.remove).toHaveBeenCalledTimes(1)
  })
  it('recua uma página quando o último registro foi excluído e preserva a busca', async () => {
    mocks.page
      .mockResolvedValueOnce({ rows: [record()], total: 13, pages: 2 })
      .mockResolvedValueOnce({ rows: [], total: 12, pages: 1 })
      .mockResolvedValue({ rows: [], total: 12, pages: 1 })
    const { wrapper } = await open(
      { kind: 'sale', record: record() },
      SalesPage,
      '?page=2&search=exemplo',
    )
    await button(wrapper, 'Excluir').trigger('click')
    await button(wrapper, 'Confirmar exclusão').trigger('click')
    await flushPromises()
    expect(mocks.page).toHaveBeenLastCalledWith(
      '/modofacil/vendas',
      expect.objectContaining({ page: 1, search: 'exemplo' }),
    )
    expect(mocks.page).toHaveBeenCalledTimes(3)
  })
  it('explica o alcance da exclusão de produto e lançamento e interpreta erros legados', async () => {
    const product = await open({ kind: 'product', record: record() })
    await button(product.wrapper, 'Excluir').trigger('click')
    expect(product.wrapper.get('[role=dialog]').text()).toContain('todas as suas variantes')
    const finance = await open({ kind: 'finance', record: record() })
    await button(finance.wrapper, 'Excluir').trigger('click')
    expect(finance.wrapper.get('[role=dialog]').text()).toContain('suas parcelas')
    expect(
      errorMessage({ response: { status: 400, data: { erro: 'Exclusão não permitida.' } } }),
    ).toBe('Exclusão não permitida.')
  })
})
