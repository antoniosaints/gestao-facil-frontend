import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useClientesStore } from '@/stores/clientes/useClientes'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { useConfirm } from '@/composables/useConfirm'
import ClientesModal from './ClientesModal.vue'

const guards = vi.hoisted(() => ({ leave: undefined as undefined | (() => Promise<boolean>) }))
vi.mock('vue-router', () => ({ onBeforeRouteLeave: (guard: () => Promise<boolean>) => { guards.leave = guard } }))
vi.mock('@/repositories/cliente-repository', () => ({ ClienteRepository: { save: vi.fn() } }))
vi.mock('vue-toastification', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('@/components/ia/IaTextAssistant.vue', () => ({ default: { template: '<span />' } }))

enableAutoUnmount(afterEach)
beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(ClienteRepository.save).mockReset()
})
afterEach(() => useConfirm().onNo())

function mountForm() {
  const store = useClientesStore()
  store.form.nome = 'Cliente de teste'
  store.openModal = true
  const wrapper = mount(ClientesModal, {
    global: {
      stubs: {
        ModalView: {
          props: ['open', 'title'], emits: ['update:open'],
          template: '<section v-if="open"><h2>{{ title }}</h2><slot /><button data-dismiss @click="$emit(\'update:open\', false)">Dispensar</button></section>',
        },
      },
    },
  })
  return { store, wrapper }
}

describe('Cadastro de clientes', () => {
  it('impede solicitações repetidas e fechamento enquanto salva', async () => {
    let finish!: (value: any) => void
    vi.mocked(ClienteRepository.save).mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const { store, wrapper } = mountForm()
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('[data-dismiss]').trigger('click')
    expect(ClienteRepository.save).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Salvando…')
    expect(store.openModal).toBe(true)
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    finish({ data: { id: 1 } })
    await flushPromises()
    expect(store.openModal).toBe(false)
  })

  it('mantém os dados e permite tentar novamente após falha', async () => {
    vi.mocked(ClienteRepository.save).mockRejectedValue(new Error('offline'))
    const { store, wrapper } = mountForm()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Seus dados foram mantidos')
    expect(store.form.nome).toBe('Cliente de teste')
    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined()
  })

  it('mantém a edição ao cancelar o descarte e reseta ao confirmar', async () => {
    const { store, wrapper } = mountForm()
    await wrapper.get('#nome').setValue('Nome alterado')
    await wrapper.get('[data-dismiss]').trigger('click')
    expect(useConfirm().isOpen.value).toBe(true)
    useConfirm().onNo()
    await flushPromises()
    expect(store.form.nome).toBe('Nome alterado')
    expect(store.openModal).toBe(true)
    await wrapper.get('[data-dismiss]').trigger('click')
    useConfirm().onYes()
    await flushPromises()
    expect(store.openModal).toBe(false)
    expect(store.form.nome).toBe('')
  })

  it('protege navegação e saída da página com dados alterados', async () => {
    const { store, wrapper } = mountForm()
    await wrapper.get('#nome').setValue('Alterado')
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
    const leave = guards.leave!()
    useConfirm().onNo()
    await expect(leave).resolves.toBe(false)
    expect(store.openModal).toBe(true)
  })
})
