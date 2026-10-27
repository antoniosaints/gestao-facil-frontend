import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
const toast = vi.hoisted(() => ({ update: vi.fn() }))
vi.mock('vue-toastification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-toastification')>()),
  useToast: () => toast,
}))
import { notifyError, notifySuccess } from '../application/notifications'
import { useDomainMutation } from '../application/useDomainMutation'
import Feedback from '../components/Feedback.vue'
import ModalDialog from '../components/ModalDialog.vue'
import ModalView from '@/components/formulario/ModalView.vue'
const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.resetAllMocks()
})
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  vi.restoreAllMocks()
})
describe('notificações do Modo Fácil', () => {
  it.each([
    { enabled: true, targetClass: 'mf-toast', prevent: true },
    { enabled: true, targetClass: 'outside', prevent: false },
    { enabled: false, targetClass: 'mf-toast', prevent: false },
  ])(
    'interação externa: proteção $enabled, alvo $targetClass',
    async ({ enabled, targetClass, prevent }) => {
      const wrapper = mount(ModalView, {
        props: {
          title: 'Editar',
          open: true,
          mobileVariant: 'dialog',
          ignoreToastInteractions: enabled,
        },
        global: {
          stubs: {
            Dialog: { template: '<div><slot/></div>' },
            DialogTitle: true,
            DialogDescription: true,
            DialogContent: {
              name: 'DialogContent',
              emits: ['interact-outside'],
              template: '<section><slot/></section>',
            },
          },
        },
      })
      wrappers.push(wrapper)
      const target = document.createElement('button')
      target.className = targetClass
      const originalEvent = new Event('pointerdown')
      target.dispatchEvent(originalEvent)
      const preventDefault = vi.fn()
      wrapper
        .getComponent({ name: 'DialogContent' })
        .vm.$emit('interact-outside', { detail: { originalEvent }, preventDefault })
      expect(preventDefault).toHaveBeenCalledTimes(prevent ? 1 : 0)
    },
  )
  it('confirma sucesso somente após terminar e bloqueia envios simultâneos', async () => {
    const mutation = useDomainMutation()
    let finish!: (value: number) => void
    const operation = vi.fn(
      () =>
        new Promise<number>((resolve) => {
          finish = resolve
        }),
    )
    const pending = mutation.run(operation, 'Cadastro salvo.')
    expect(toast.update).not.toHaveBeenCalled()
    expect(await mutation.run(operation, 'Cadastro salvo.')).toBeNull()
    finish(12)
    expect(await pending).toEqual({ value: 12 })
    expect(operation).toHaveBeenCalledOnce()
    expect(toast.update).toHaveBeenCalledExactlyOnceWith(
      'modofacil:success:Cadastro salvo.',
      expect.objectContaining({
        content: 'Cadastro salvo.',
        options: expect.objectContaining({
          type: 'success',
          toastClassName: ['mf-theme', 'mf-toast', 'mf-toast--success'],
          accessibility: { toastRole: 'status', closeButtonLabel: 'Fechar notificação' },
        }),
      }),
      true,
    )
  })
  it('falha conhecida continua no formulário e permite corrigir e salvar', async () => {
    const mutation = useDomainMutation()
    await mutation.run(async () => {
      throw { response: { status: 422, data: { message: 'Nome obrigatório.' } } }
    }, 'Salvo.')
    expect(mutation.error.value).toContain('Nome obrigatório')
    expect(mutation.uncertain.value).toBe(false)
    expect(toast.update.mock.lastCall?.[1].options.type).toBe('error')
    expect(await mutation.run(async () => 12, 'Salvo.')).toEqual({ value: 12 })
    expect(toast.update.mock.lastCall?.[1].options.type).toBe('success')
  })
  it('resultado incerto mostra aviso completo e não permite repetir a operação', async () => {
    const mutation = useDomainMutation()
    const operation = vi.fn().mockRejectedValue(new Error('Conexão interrompida'))
    await mutation.run(operation, 'Salvo.')
    expect(mutation.uncertain.value).toBe(true)
    expect(toast.update.mock.lastCall?.[1]).toMatchObject({
      content: expect.stringContaining('O resultado pode ter sido registrado'),
      options: { type: 'warning', timeout: 10000 },
    })
    expect(await mutation.run(operation, 'Salvo.')).toBeNull()
    expect(operation).toHaveBeenCalledOnce()
  })
  it('falha de exibição do toast não transforma uma gravação confirmada em erro', async () => {
    toast.update.mockImplementation(() => {
      throw new Error('Interface de notificações indisponível')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mutation = useDomainMutation()
    expect(await mutation.run(async () => 12, 'Salvo.')).toEqual({ value: 12 })
    expect(mutation.error.value).toBe('')
    expect(mutation.uncertain.value).toBe(false)
    expect(mutation.busy.value).toBe(false)
  })
  it('feedback mantém erros e confirmações acessíveis, sem toast de carregamento', async () => {
    const wrapper = mount(Feedback, { props: { loading: true } })
    wrappers.push(wrapper)
    expect(toast.update).not.toHaveBeenCalled()
    await wrapper.setProps({ loading: false, error: 'Não foi possível consultar a lista.' })
    expect(wrapper.get('[role=alert]').text()).toContain('Não foi possível consultar')
    expect(toast.update.mock.lastCall?.[1].options.type).toBe('error')
    await wrapper.setProps({ error: '', message: 'Categoria cadastrada.' })
    expect(wrapper.get('[role=status]').text()).toContain('Categoria cadastrada')
    expect(toast.update.mock.lastCall?.[1].options.type).toBe('success')
  })
  it('a operação e o feedback atualizam a mesma notificação em vez de criar duas', async () => {
    const mutation = useDomainMutation()
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(Feedback, { message: mutation.message.value, error: mutation.error.value }),
      }),
    )
    wrappers.push(wrapper)
    await mutation.run(async () => 12, 'Situação atualizada.')
    await flushPromises()
    expect(toast.update).toHaveBeenCalledTimes(2)
    expect(new Set(toast.update.mock.calls.map(([id]) => id)).size).toBe(1)
    expect(toast.update.mock.calls.every(([, , create]) => create === true)).toBe(true)
  })
  it('o erro do modal permanece visível e também gera notificação', () => {
    const wrapper = mount(ModalDialog, {
      props: { title: 'Editar', error: 'Falha ao salvar.' },
      global: { stubs: { ModalView: { template: '<div><slot/></div>' } } },
    })
    wrappers.push(wrapper)
    expect(wrapper.get('[role=alert]').text()).toBe('Falha ao salvar.')
    expect(toast.update.mock.lastCall?.[1].content).toBe('Falha ao salvar.')
  })
  it('ignora mensagens vazias e diferencia aviso de resultado incerto de erro comum', () => {
    notifySuccess(' ')
    notifyError('')
    expect(toast.update).not.toHaveBeenCalled()
    notifyError('Confira Pessoas antes de repetir; o cadastro pode ter sido criado.')
    expect(toast.update.mock.lastCall?.[1].options.type).toBe('warning')
    notifyError('Nome obrigatório.')
    expect(toast.update.mock.lastCall?.[1].options.type).toBe('error')
  })
})
