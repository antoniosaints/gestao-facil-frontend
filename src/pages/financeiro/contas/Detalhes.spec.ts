import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useContasFinanceirasStore } from '@/stores/lancamentos/useContasFinanceiras'
import Detalhes from './Detalhes.vue'

const getContaFinanceiraDetalhes = vi.hoisted(() => vi.fn())
vi.mock('@/repositories/lancamento-repository', () => ({
  LancamentosRepository: { getContaFinanceiraDetalhes },
}))

afterEach(() => {
  localStorage.removeItem('gestao_facil:support:active')
  getContaFinanceiraDetalhes.mockReset()
})

async function montar(id: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/financeiro/contas', name: 'financeiro-contas', component: { template: '<div />' } },
      { path: '/financeiro/contas/:id', name: 'financeiro-conta-detalhes', component: Detalhes },
    ],
  })
  await router.push('/financeiro/contas/' + id)
  const pinia = createPinia()
  const wrapper = mount(Detalhes, {
    global: {
      plugins: [pinia, router],
      stubs: {
        Calendarpicker: true,
        DataTable: true,
        ModalConta: true,
        ModalAjusteSaldoConta: true,
        ModalTransferenciaConta: true,
      },
    },
  })
  await flushPromises()
  return { wrapper, router, store: useContasFinanceirasStore(pinia) }
}

describe('Página da conta financeira', () => {
  it('abre pela URL e oferece a edição de cálculos ao suporte sem a permissão comum', async () => {
    localStorage.setItem('gestao_facil:support:active', '1')
    const conta = { id: 7, nome: 'Reserva', saldoInicial: 10, ignorarNosCalculos: true }
    getContaFinanceiraDetalhes.mockResolvedValue({ data: { conta, resumo: null } })
    const { wrapper, store } = await montar('7')

    expect(getContaFinanceiraDetalhes).toHaveBeenCalledWith(
      7, expect.objectContaining({ tipo: 'TODOS', status: 'TODOS' }),
    )
    expect(wrapper.get('h1').text()).toBe('Reserva')
    expect(wrapper.text()).toContain('Fora dos cálculos gerais')
    expect(wrapper.get('a').attributes('href')).toBe('/financeiro/contas')
    expect(wrapper.text()).not.toContain('Editar conta')

    const alterar = wrapper.findAll('button').find((button) => button.text() === 'Alterar participação')
    expect(alterar).toBeDefined()
    await alterar!.trigger('click')
    expect(store.openModal).toBe(true)
    expect(store.somenteCalculos).toBe(true)
    expect(store.selectedConta).toMatchObject(conta)
    wrapper.unmount()
  })

  it('trata uma URL inválida sem consultar o backend', async () => {
    const { wrapper } = await montar('invalida')
    expect(wrapper.text()).toContain('Conta financeira inválida.')
    expect(getContaFinanceiraDetalhes).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
