import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
const api = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('../adapters/configuration', () => ({ configurationApi: api }))
import { experience, refreshExperience } from '../application/experience'
import { useExperienceEntry } from '../application/useExperienceEntry'
const wrappers: ReturnType<typeof mount>[] = []
function shell() {
  const wrapper = mount(
    defineComponent({
      setup() {
        const entered = useExperienceEntry()
        return () =>
          h(
            'p',
            entered.value
              ? 'Área de trabalho'
              : experience.loading
                ? 'Preparando'
                : experience.error
                  ? 'Tentar novamente'
                  : 'Aguardando',
          )
      },
    }),
  )
  wrappers.push(wrapper)
  return wrapper
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  experience.configuration = null
  experience.error = ''
})
afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()))
describe('entrada da área de trabalho', () => {
  it('busca a preferência ausente na montagem e abre a área quando ela chega', async () => {
    localStorage.setItem('gestao_facil:token', 'entrada-pendente')
    let resolve!: (value: unknown) => void
    api.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const wrapper = shell()
    await flushPromises()
    expect(wrapper.text()).toBe('Preparando')
    expect(api.get).toHaveBeenCalledOnce()
    resolve({ modo: 'FACIL', versao: 1, podeAlterar: true })
    await flushPromises()
    expect(wrapper.text()).toBe('Área de trabalho')
  })
  it('permite tentar novamente após falha inicial sem exigir passagem por configurações', async () => {
    localStorage.setItem('gestao_facil:token', 'entrada-retry')
    api.get.mockRejectedValueOnce(new Error('offline'))
    const wrapper = shell()
    await flushPromises()
    expect(wrapper.text()).toBe('Tentar novamente')
    api.get.mockResolvedValueOnce({ modo: 'FACIL', versao: 1, podeAlterar: true })
    await refreshExperience()
    await flushPromises()
    expect(wrapper.text()).toBe('Área de trabalho')
  })
  it('não mantém a área anterior aberta após trocar de sessão', async () => {
    localStorage.setItem('gestao_facil:token', 'entrada-a')
    api.get.mockResolvedValueOnce({ modo: 'FACIL', versao: 1, podeAlterar: true })
    const wrapper = shell()
    await flushPromises()
    expect(wrapper.text()).toBe('Área de trabalho')
    localStorage.setItem('gestao_facil:token', 'entrada-b')
    api.get.mockRejectedValueOnce(new Error('offline'))
    await refreshExperience()
    await flushPromises()
    expect(wrapper.text()).toBe('Tentar novamente')
  })
})
