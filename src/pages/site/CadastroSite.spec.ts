import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ContaRepository } from '@/repositories/conta-repository'
import { OnboardingRepository } from '@/repositories/onboarding-repository'
import { useAccountCreateStore } from '@/stores/login/useCreateAccount'
import { DEFAULT_THEME_CUSTOMIZATION } from '@/utils/themeCustomization'
import type { OnboardingConfig, OnboardingPreviewInput } from '@/types/onboarding'
import Cadastro from './CadastroSite.vue'
import ThemePreview from './components/ThemePreview.vue'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { ref: 'CONVITE' } }),
  useRouter: () => ({ push }),
}))
vi.mock('@/repositories/conta-repository', () => ({ ContaRepository: { create: vi.fn() } }))
vi.mock('@/repositories/onboarding-repository', () => ({
  OnboardingRepository: { config: vi.fn(), preview: vi.fn() },
}))
vi.mock('vue-toastification', () => ({ useToast: () => ({ success: vi.fn() }) }))
enableAutoUnmount(afterEach)

const config: OnboardingConfig = {
  version: 1,
  catalogVersion: 'catalog-one',
  questions: [
    { key: 'vendeProdutos', label: 'Vende produtos?' },
    { key: 'prestaServicos', label: 'Presta serviços?' },
  ],
  baseMenuKeys: ['dashboard', 'clientes'],
  modules: [
    {
      codigo: 'servicos',
      nome: 'Serviços',
      menuKey: 'servicos',
      precoMensal: 0,
      status: true,
      ativacaoNoCadastro: true,
    },
    {
      codigo: 'atendimento',
      nome: 'Atendimento',
      menuKey: 'atendimento',
      precoMensal: 29.9,
      status: true,
      ativacaoNoCadastro: false,
    },
  ],
  themePresets: [
    { id: 'azul', nome: 'Azul', tema: DEFAULT_THEME_CUSTOMIZATION },
    {
      id: 'verde',
      nome: 'Verde',
      tema: { ...DEFAULT_THEME_CUSTOMIZATION, primariaLight: '#059669', primariaDark: '#10B981' },
    },
  ],
  fonts: ['Inter', 'Sora'],
}
beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  vi.clearAllMocks()
  vi.mocked(OnboardingRepository.config).mockResolvedValue(structuredClone(config))
  vi.mocked(OnboardingRepository.preview).mockImplementation(
    async (input: OnboardingPreviewInput) => ({
      version: 1,
      catalogVersion: 'catalog-one',
      menusSugeridos: ['dashboard', 'clientes', 'servicos'],
      menusEfetivos: input.menusSelecionados || [
        'dashboard',
        'clientes',
        'servicos',
        'produtos:combos',
      ],
      modulos: config.modules.map((module) => ({
        codigo: module.codigo,
        motivo: 'Recomendado pela operação',
        precoMensal: module.precoMensal,
        selecionado: input.modulosSelecionados?.includes(module.codigo) ?? true,
        acao:
          input.modulosSelecionados && !input.modulosSelecionados.includes(module.codigo)
            ? 'NAO_SELECIONADO'
            : module.precoMensal
              ? 'RECOMENDAR_CONTRATACAO'
              : 'ATIVAR_GRATUITO',
      })),
      avisos: ['Apps pagos exigem contratação posterior.'],
    }),
  )
})
const start = async () => {
  const wrapper = mount(Cadastro, { global: { stubs: { RouterLink: RouterLinkStub } } })
  await flushPromises()
  return wrapper
}
type Wizard = Awaited<ReturnType<typeof start>>
const submit = async (wrapper: Wizard) => {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}
const toModules = async (wrapper: Wizard) => {
  for (const [id, value] of Object.entries({
    firstName: 'Ana',
    lastName: 'Silva',
    email: 'ana@example.com',
    phone: '11999999999',
    password: 'Segredo123',
  }))
    await wrapper.get(`#${id}`).setValue(value)
  await submit(wrapper)
  await wrapper.get('#storeName').setValue('Oficina exemplo')
  await wrapper.get('#segment').setValue('servicos')
  await wrapper.get('#employees').setValue('5')
  await wrapper.findAll('input[type="checkbox"]')[1]!.setValue(true)
  await submit(wrapper)
}

describe('Cadastro guiado', () => {
  it('aponta erros, preserva dados ao voltar e pede recomendação ao backend', async () => {
    const wrapper = await start()
    await submit(wrapper)
    expect(wrapper.get('#firstName').attributes('aria-invalid')).toBe('true')
    expect(wrapper.text()).toContain('Informe seu nome.')
    await toModules(wrapper)
    expect(wrapper.text()).toContain('contratação posterior')
    expect(wrapper.text()).not.toContain('produtos:combos')
    expect(OnboardingRepository.preview).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 1,
        catalogVersion: 'catalog-one',
        respostas: expect.objectContaining({ prestaServicos: true, vendeProdutos: false }),
      }),
    )
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Voltar'))!
      .trigger('click')
    expect((wrapper.get('#storeName').element as HTMLInputElement).value).toBe('Oficina exemplo')
  })

  it('envia seleção revisada, tema e indicação sem preço e bloqueia envio repetido', async () => {
    const wrapper = await start()
    await toModules(wrapper)
    const paid = wrapper.findAll('label').find((label) => label.text().includes('Atendimento') && label.text().includes('contrata\u00e7\u00e3o posterior'))!
    await paid.get('input').setValue(false)
    await submit(wrapper)
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Verde')!
      .trigger('click')
    await wrapper.get('#font').setValue('Sora')
    await submit(wrapper)
    await wrapper.get('#terms').setValue(true)
    let finish!: () => void
    vi.mocked(ContaRepository.create).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({} as Awaited<ReturnType<typeof ContaRepository.create>>)
        }),
    )
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(ContaRepository.create).toHaveBeenCalledTimes(1)
    const payload = vi.mocked(ContaRepository.create).mock.calls[0]![0]
    expect(payload.indicacao).toBe('CONVITE')
    expect(payload.senha).toBe('Segredo123')
    expect(payload.onboarding).toMatchObject({
      version: 1,
      catalogVersion: 'catalog-one',
      modulosSelecionados: ['servicos'],
      temaPersonalizado: { fonte: 'Sora', primariaLight: '#059669' },
    })
    expect(JSON.stringify(payload.onboarding)).not.toContain('preco')
    expect(JSON.stringify(localStorage)).not.toContain('Segredo123')
    finish()
    await flushPromises()
    expect(push).toHaveBeenCalledWith('/login')
    expect(useAccountCreateStore().form.password).toBe('')
  })

  it('exige nova revisão quando o catálogo muda e mantém dados pessoais', async () => {
    const wrapper = await start()
    await toModules(wrapper)
    await submit(wrapper)
    await submit(wrapper)
    await wrapper.get('#terms').setValue(true)
    vi.mocked(ContaRepository.create).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { code: 'ONBOARDING_CATALOG_CHANGED' } },
    })
    await submit(wrapper)
    expect(wrapper.text()).toContain('O catálogo mudou')
    expect(wrapper.get('h2').text()).toBe('Seus módulos')
    expect(useAccountCreateStore().form.email).toBe('ana@example.com')
    expect(push).not.toHaveBeenCalled()
    expect(OnboardingRepository.config).toHaveBeenCalledTimes(2)
  })

  it('recupera falha na configuração sem criar conta incompleta', async () => {
    vi.mocked(OnboardingRepository.config).mockRejectedValueOnce(new Error('offline'))
    const wrapper = await start()
    expect(wrapper.find('form').exists()).toBe(false)
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Tentar novamente')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(true)
    expect(ContaRepository.create).not.toHaveBeenCalled()
  })
})

it('isola fontes e cores da prévia light/dark sem alterar o tema global', () => {
  const original = document.documentElement.getAttribute('style')
  const light = mount(ThemePreview, {
    props: { theme: { ...DEFAULT_THEME_CUSTOMIZATION, fonte: 'Sora' }, mode: 'light' },
  })
  const dark = mount(ThemePreview, { props: { theme: DEFAULT_THEME_CUSTOMIZATION, mode: 'dark' } })
  expect(light.get('figure').attributes('style')).toContain('Sora')
  expect(light.get('figure').attributes('style')).not.toBe(dark.get('figure').attributes('style'))
  expect(document.documentElement.getAttribute('style')).toBe(original)
})
