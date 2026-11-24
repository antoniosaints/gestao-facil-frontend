import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import EntityLink from './EntityLink.vue'

const ui = vi.hoisted(() => ({
  usuarioLogged: { permissao: 'admin', superAdmin: false },
  hasActiveModule: vi.fn(() => true),
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => ui }))

const page = { template: '<div />' }
async function render(recordId: number | null, permissao = 'admin', iconOnly = false) {
  ui.usuarioLogged.permissao = permissao
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: page },
      {
        path: '/financeiro/contas/:id',
        name: 'financeiro-conta-detalhes',
        meta: { permissao: 3 },
        component: page,
      },
    ],
  })
  await router.push('/')
  return mount(EntityLink, {
    props: { kind: 'conta', recordId, label: 'Conta principal', iconOnly, newTab: iconOnly },
    global: { plugins: [router] },
  })
}

describe('EntityLink', () => {
  it('usa a rota do registro e um ícone apenas visual', async () => {
    const wrapper = await render(15)
    expect(wrapper.get('a').attributes('href')).toBe('/financeiro/contas/15')
    expect(wrapper.get('a').text()).toBe('Conta principal')
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
    wrapper.unmount()
  })

  it('preserva o nome sem criar um link quando falta o vínculo ou a permissão', async () => {
    for (const [id, permissao] of [
      [null, 'admin'],
      [15, 'vendedor'],
    ] as const) {
      const wrapper = await render(id, permissao)
      expect(wrapper.find('a').exists()).toBe(false)
      expect(wrapper.text()).toBe('Conta principal')
      wrapper.unmount()
    }
  })

  it('identifica o atalho somente com ícone e abre a aba separada nos formulários', async () => {
    const wrapper = await render(15, 'admin', true)
    expect(wrapper.get('a').attributes('aria-label')).toBe(
      'Abrir conta financeira: Conta principal',
    )
    expect(wrapper.get('a').attributes('target')).toBe('_blank')
    expect(wrapper.get('a').attributes('rel')).toBe('noopener')
    wrapper.unmount()
  })
})
