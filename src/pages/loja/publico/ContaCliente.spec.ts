import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  getPublicStore: vi.fn().mockResolvedValue({ identity: { name: 'Loja Teste', logo: null }, colors: { primary: '#4f46e5', secondary: '#0ea5e9' } }),
  customerMe: vi.fn().mockResolvedValue({ id: 1, nome: 'Cliente Teste', email: 'cliente@teste.com', telefone: '11999999999', enderecos: [], pedidos: [] }),
  customerAuth: vi.fn(),
  saveCustomerAddress: vi.fn(),
  removeCustomerAddress: vi.fn(),
}))

vi.mock('@/repositories/loja-repository', () => ({ LojaRepository: repository }))

import ContaCliente from './ContaCliente.vue'

const App = defineComponent({ setup: () => () => h(RouterView) })
const Blank = defineComponent({ setup: () => () => null })

afterEach(() => {
  localStorage.clear()
  repository.customerMe.mockClear()
  repository.customerAuth.mockClear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('style')
})

describe('ContaCliente', () => {
  it('carrega a conta ao trocar do login para a rota reutilizada de conta', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/lojas/:slug', component: Blank },
        { path: '/lojas/:slug/login', component: ContaCliente, meta: { customerMode: 'login' } },
        { path: '/lojas/:slug/conta', component: ContaCliente, meta: { customerMode: 'account' } },
        { path: '/lojas/:slug/esqueci-senha', component: Blank },
        { path: '/lojas/:slug/cadastro', component: Blank },
      ],
    })
    await router.push('/lojas/minha-loja/login')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    localStorage.setItem('gestao-facil:loja:minha-loja:access-token', 'token-cliente')
    await router.push('/lojas/minha-loja/conta')
    await flushPromises()

    expect(repository.customerMe).toHaveBeenCalledWith('minha-loja', 'token-cliente')
    expect(wrapper.text()).toContain('Cliente Teste')
    wrapper.unmount()
  })

  it('faz login, salva o token do cliente e carrega a conta sem recarregar', async () => {
    repository.customerAuth.mockResolvedValueOnce({ accessToken: 'novo-token' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/lojas/:slug', component: Blank },
        { path: '/lojas/:slug/login', component: ContaCliente, meta: { customerMode: 'login' } },
        { path: '/lojas/:slug/conta', component: ContaCliente, meta: { customerMode: 'account' } },
        { path: '/lojas/:slug/esqueci-senha', component: Blank },
        { path: '/lojas/:slug/cadastro', component: Blank },
      ],
    })
    await router.push('/lojas/minha-loja/login')
    await router.isReady()
    const wrapper = mount(App, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find('input[type="email"]').setValue('cliente@teste.com')
    await wrapper.find('input[type="password"]').setValue('Senha123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(repository.customerAuth).toHaveBeenCalledWith('minha-loja', 'login', { email: 'cliente@teste.com', password: 'Senha123' })
    expect(localStorage.getItem('gestao-facil:loja:minha-loja:access-token')).toBe('novo-token')
    expect(router.currentRoute.value.path).toBe('/lojas/minha-loja/conta')
    expect(repository.customerMe).toHaveBeenCalledWith('minha-loja', 'novo-token')
    expect(wrapper.text()).toContain('Cliente Teste')
    wrapper.unmount()
  })
})
