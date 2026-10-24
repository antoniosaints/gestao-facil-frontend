import { afterEach, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import HomePage from './HomePage.vue'
import { SiteRepository } from '@/repositories/site-repository'
import { cloneSiteConfig } from './siteContent'
vi.mock('@/repositories/site-repository', () => ({ SiteRepository: { getPublicConfig: vi.fn() } }))
enableAutoUnmount(afterEach)
it('preserva conteúdo configurável e links reais sem depoimentos inventados', async () => {
  const config = cloneSiteConfig()
  config.hero.title = 'Minha plataforma configurada'
  config.hero.monthlyPrice = 99
  config.features = [
    { title: 'Recurso configurado', description: 'Descrição editável', icon: 'Wallet' },
  ]
  vi.mocked(SiteRepository.getPublicConfig).mockResolvedValue(config)
  const wrapper = mount(HomePage, {
    global: { stubs: { RouterLink: RouterLinkStub, SiteNichesShowcase: true } },
  })
  await flushPromises()
  expect(wrapper.get('h1').text()).toBe(config.hero.title)
  expect(wrapper.text()).toContain('Recurso configurado')
  expect(wrapper.text()).toContain('99,00')
  expect(wrapper.text()).not.toMatch(/Carla Dias|Roberto Júnior|Fernanda Costa|5 min/)
  expect(
    wrapper.findAllComponents(RouterLinkStub).some((link) => link.props('to') === '/site/cadastro'),
  ).toBe(true)
  await wrapper.get('button[aria-controls="site-mobile-menu"]').trigger('click')
  expect(wrapper.get('#site-mobile-menu').text()).toContain('Criar minha conta')
})
