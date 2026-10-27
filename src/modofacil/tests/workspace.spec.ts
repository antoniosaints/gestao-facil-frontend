import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, onMounted, provide, ref } from 'vue'
import { createMemoryHistory, createRouter, RouterLink, RouterView } from 'vue-router'
import ModalWorkspace from '../components/ModalWorkspace.vue'
import ModalAction from '../components/ModalAction.vue'
import FormBack from '../components/FormBack.vue'
import FormResultLink from '../components/FormResultLink.vue'
import {
  createModalWorkspace,
  modalWorkspaceKey,
  useFormContext,
} from '../application/modalWorkspace'
import { forms } from '../application/formDialogs'
import { usePage } from '../application/usePage'
import { useFlow } from '../application/useFlow'
import { confirmationKey } from '../application/confirmation'
import { markDataChanged } from '../application/dataChanges'
import { experience } from '../application/experience'
const api = vi.hoisted(() => ({ page: vi.fn(), read: vi.fn(), patch: vi.fn() }))
vi.mock('../adapters/domain', () => ({ api }))
const wrappers: ReturnType<typeof mount>[] = []
const busy = ref(false)
const Form = defineComponent({
  setup() {
    const context = useFormContext(),
      dirty = ref(false),
      draft = ref('')
    useFlow(dirty, busy)
    return () =>
      h('form', [
        h('p', `Contexto ${JSON.stringify(context)}`),
        h('input', {
          'aria-label': 'Nome no formulário',
          value: draft.value,
          onInput: (event: Event) => {
            draft.value = (event.target as HTMLInputElement).value
            dirty.value = true
          },
        }),
        h(FormBack, { to: '/modofacil/produtos' }, { default: () => 'Cancelar cadastro' }),
        h(
          FormResultLink,
          { to: '/modofacil/produtos' },
          { default: () => 'Concluir e ver registros' },
        ),
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              markDataChanged('/modofacil/produtos')
              dirty.value = false
            },
          },
          'Salvar exemplo',
        ),
        h(
          ModalAction,
          { form: 'pessoa-nova', query: { tipo: 'FORNECEDOR' } },
          { default: () => 'Cadastrar fornecedor' },
        ),
        h(RouterLink, { to: '/modofacil/pessoas' }, { default: () => 'Abrir outra página' }),
      ])
  },
})
const List = defineComponent({
  setup() {
    const list = usePage(() => '/modofacil/produtos')
    onMounted(() => list.load())
    return () =>
      h('section', [
        h('input', {
          'aria-label': 'Buscar',
          value: list.search.value,
          onInput: (event: Event) => {
            list.search.value = (event.target as HTMLInputElement).value
          },
        }),
        h('p', `Página ${list.page.value}`),
        ...list.rows.value.map((row) => h('article', { key: row.id }, row.nome)),
        h(ModalAction, { form: 'produto-novo' }, { default: () => 'Novo produto' }),
        h(
          ModalAction,
          { form: 'pessoa-editar', params: { id: 7 } },
          { default: () => 'Editar contato' },
        ),
        h(
          ModalAction,
          {
            form: 'variante',
            params: { produtoBaseId: 11, varianteId: 73 },
            query: { varianteId: 73 },
          },
          { default: () => 'Editar variante' },
        ),
      ])
  },
})
async function open(path = '/modofacil/produtos?page=3&search=cafe', allowed = true) {
  const workspace = createModalWorkspace(() => allowed)
  const confirm = vi.fn().mockResolvedValue(false)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/modofacil',
        component: ModalWorkspace,
        children: [
          { path: 'produtos', name: 'modofacil-produtos', component: List },
          { path: 'produtos/novo', redirect: '/modofacil/produtos' },
          { path: 'pessoas', component: { template: '<p>Página de pessoas</p>' } },
        ],
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(
    defineComponent({
      setup() {
        provide(modalWorkspaceKey, workspace)
        provide(confirmationKey, confirm)
        return () => h(RouterView)
      },
    }),
    {
      global: {
        plugins: [router],
        stubs: {
          ModalDialog: {
            props: ['title', 'busy', 'inactive'],
            emits: ['close'],
            template:
              '<section role="dialog" :aria-label="title" :inert="inactive"><slot/><button :disabled="busy" @click="$emit(\'close\')">Fechar</button></section>',
          },
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  const push = vi.spyOn(router, 'push'),
    replace = vi.spyOn(router, 'replace')
  return { wrapper, router, workspace, confirm, push, replace }
}
const click = async (wrapper: any, label: string) => {
  await wrapper
    .findAll('button')
    .find((button: any) => button.text() === label)!
    .trigger('click')
  await flushPromises()
}
beforeEach(() => {
  vi.clearAllMocks()
  busy.value = false
  for (const name of ['produto-novo', 'variante', 'pessoa-nova'] as const)
    vi.spyOn(forms[name], 'component').mockResolvedValue({ default: Form })
  api.page.mockResolvedValue({ rows: [{ id: 1, nome: 'Produto existente' }], pages: 5, total: 50 })
  api.read.mockResolvedValue({
    id: 7,
    nome: 'Maria',
    telefone: '123',
    email: 'maria@example.test',
    whastapp: '',
    documento: 'preservar',
  })
  api.patch.mockResolvedValue({ id: 7 })
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})
describe('modais por estado local', () => {
  it.each<{ params: Record<string, number>; title: string }>([
    { params: { id: 5 }, title: 'Adicionar parcela' },
    { params: { id: 5, parcelaId: 9 }, title: 'Editar parcela' },
  ])('identifica a operação da parcela no título do modal: $title', async ({ params, title }) => {
    vi.spyOn(forms['financeiro-parcela'], 'component').mockResolvedValue({ default: Form })
    const { wrapper, workspace } = await open()
    workspace.open({ form: 'financeiro-parcela', params }, '/modofacil/financeiro')
    await flushPromises()
    expect(wrapper.get('[role=dialog]').attributes('aria-label')).toBe(title)
  })
  it('abre e cancela sem navegar, remontar a lista ou repetir consultas', async () => {
    const { wrapper, router, push, replace } = await open()
    const field = wrapper.get('input').element
    await wrapper.get('input').setValue('Filtro ainda não aplicado')
    await click(wrapper, 'Novo produto')
    expect(router.currentRoute.value.fullPath).toBe('/modofacil/produtos?page=3&search=cafe')
    expect(api.page).toHaveBeenCalledOnce()
    expect(wrapper.find('[role=dialog]').exists()).toBe(true)
    await click(wrapper, 'Cancelar cadastro')
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(wrapper.get('input').element).toBe(field)
    expect((field as HTMLInputElement).value).toBe('Filtro ainda não aplicado')
    expect(wrapper.text()).toContain('Página 3')
    expect(api.page).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })
  it('salva e atualiza uma vez ao fechar, mantendo URL, filtros e página', async () => {
    const { wrapper, router, push } = await open()
    await click(wrapper, 'Novo produto')
    await click(wrapper, 'Salvar exemplo')
    expect(api.page).toHaveBeenCalledOnce()
    api.page.mockResolvedValueOnce({
      rows: [{ id: 2, nome: 'Produto atualizado' }],
      pages: 5,
      total: 51,
    })
    await click(wrapper, 'Fechar')
    expect(api.page).toHaveBeenCalledTimes(2)
    expect(api.page).toHaveBeenLastCalledWith('/modofacil/produtos', { page: 3, search: 'cafe' })
    expect(wrapper.get('article').text()).toBe('Produto atualizado')
    expect(router.currentRoute.value.fullPath).toBe('/modofacil/produtos?page=3&search=cafe')
    expect(push).not.toHaveBeenCalled()
    await click(wrapper, 'Novo produto')
    await click(wrapper, 'Fechar')
    expect(api.page).toHaveBeenCalledTimes(2)
  })
  it('passa os IDs e opções ao formulário sem usar params/query da página', async () => {
    const { wrapper, router } = await open()
    await click(wrapper, 'Editar variante')
    expect(wrapper.get('[role=dialog]').text()).toContain('"produtoBaseId":"11","varianteId":"73"')
    expect(wrapper.get('[role=dialog]').text()).toContain('"query":{"varianteId":"73"}')
    expect(router.currentRoute.value.params).toEqual({})
    expect(router.currentRoute.value.query).toEqual({ page: '3', search: 'cafe' })
  })
  it('conclui no resultado que já está ao fundo sem criar navegação duplicada', async () => {
    const { wrapper, router, push, replace } = await open()
    await click(wrapper, 'Novo produto')
    await click(wrapper, 'Salvar exemplo')
    await click(wrapper, 'Concluir e ver registros')
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/modofacil/produtos?page=3&search=cafe')
    expect(push).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(api.page).toHaveBeenCalledTimes(2)
  })
  it('edita o contato pelo formulário real passando o ID por estado e somente os campos alterados', async () => {
    const { wrapper, router, push } = await open()
    await click(wrapper, 'Editar contato')
    await flushPromises()
    // Resolve the real lazy component import and its initial read.
    await vi.waitFor(() => expect(wrapper.find('[role=dialog] form').exists()).toBe(true))
    const field = wrapper
      .get('[role=dialog]')
      .findAll('label')
      .find((label) => label.text().startsWith('Nome'))!
      .get('input')
    await field.setValue('Maria atualizada')
    await wrapper.get('[role=dialog] form').trigger('submit')
    await flushPromises()
    expect(api.read).toHaveBeenCalledExactlyOnceWith('/modofacil/pessoas/7')
    expect(api.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/pessoas/7/basico', {
      nome: 'Maria atualizada',
    })
    expect(wrapper.get('[role=dialog]').text()).toContain('Pessoa atualizada')
    expect(router.currentRoute.value.fullPath).toBe('/modofacil/produtos?page=3&search=cafe')
    expect(push).not.toHaveBeenCalled()
  })
  it('recusa descarte e conserva o preenchimento ao fechar pelo X', async () => {
    const { wrapper, workspace, confirm } = await open()
    await click(wrapper, 'Novo produto')
    await wrapper.get('[role=dialog] input').setValue('Rascunho')
    await click(wrapper, 'Fechar')
    expect(confirm).toHaveBeenCalledOnce()
    expect(workspace.entries.value).toHaveLength(1)
    expect((wrapper.get('[role=dialog] input').element as HTMLInputElement).value).toBe('Rascunho')
    confirm.mockResolvedValue(true)
    await click(wrapper, 'Cancelar cadastro')
    expect(workspace.entries.value).toHaveLength(0)
    expect(experience.dirty).toBe(false)
  })
  it('mantém o rascunho do modal anterior ao abrir e fechar um cadastro auxiliar', async () => {
    const { wrapper, workspace, push } = await open()
    await click(wrapper, 'Novo produto')
    await wrapper.get('[role=dialog] input').setValue('Rascunho principal')
    const original = wrapper.get('[role=dialog] input').element
    await click(wrapper, 'Cadastrar fornecedor')
    expect(workspace.entries.value).toHaveLength(2)
    expect(wrapper.findAll('[role=dialog]')[1]!.text()).toContain('"tipo":"FORNECEDOR"')
    await wrapper
      .findAll('[role=dialog]')[1]!
      .findAll('button')
      .find((b) => b.text() === 'Cancelar cadastro')!
      .trigger('click')
    await flushPromises()
    expect(workspace.entries.value).toHaveLength(1)
    expect(wrapper.get('[role=dialog] input').element).toBe(original)
    expect((original as HTMLInputElement).value).toBe('Rascunho principal')
    expect(experience.dirty).toBe(true)
    expect(push).not.toHaveBeenCalled()
  })
  it('bloqueia fechar, abrir outro modal e navegar durante envio', async () => {
    const { wrapper, workspace, router, confirm } = await open()
    await click(wrapper, 'Novo produto')
    busy.value = true
    expect(await workspace.close()).toBe(false)
    expect(workspace.open({ form: 'pessoa-nova' }, router.currentRoute.value.fullPath)).toBe(false)
    await router.push('/modofacil/pessoas')
    expect(router.currentRoute.value.path).toBe('/modofacil/produtos')
    expect(workspace.entries.value).toHaveLength(1)
    expect(confirm).not.toHaveBeenCalled()
  })
  it('somente a navegação para outra página altera a URL e fecha o modal após confirmação', async () => {
    const { wrapper, router, workspace, confirm } = await open()
    await click(wrapper, 'Novo produto')
    await wrapper.get('[role=dialog] input').setValue('Rascunho')
    await router.push('/modofacil/pessoas')
    expect(router.currentRoute.value.path).toBe('/modofacil/produtos')
    expect(workspace.entries.value).toHaveLength(1)
    confirm.mockResolvedValue(true)
    await router.push('/modofacil/pessoas')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/modofacil/pessoas')
    expect(workspace.entries.value).toHaveLength(0)
  })
  it('verifica a permissão sem depender da guarda de uma rota de formulário', async () => {
    const { wrapper, workspace, push } = await open(undefined, false)
    await click(wrapper, 'Novo produto')
    expect(workspace.entries.value).toHaveLength(0)
    expect(wrapper.text()).toContain('Você não tem permissão')
    expect(push).not.toHaveBeenCalled()
  })
  it('redireciona uma URL antiga para a listagem sem abrir modal', async () => {
    const { wrapper, router, workspace } = await open('/modofacil/produtos/novo')
    expect(router.currentRoute.value.path).toBe('/modofacil/produtos')
    expect(workspace.entries.value).toHaveLength(0)
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
  })
})
