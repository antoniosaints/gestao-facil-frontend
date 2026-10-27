import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h, type Component } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
const mocks = vi.hoisted(() => ({
  page: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  ui: { usuarioLogged: { permissao: 'admin' } },
}))
vi.mock('../adapters/domain', () => ({
  api: { page: mocks.page, patch: mocks.patch, remove: mocks.remove },
  resolveFileUrl: (path: string) => `/media/${path}`,
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => mocks.ui }))
import ProductsPage from '../pages/ProductsPage.vue'
import ServicesPage from '../pages/ServicesPage.vue'
import ProductPhoto from '../components/ProductPhoto.vue'
import RecordsTable from '../components/RecordsTable.vue'
import RecordStatusAction from '../components/RecordStatusAction.vue'
import DeleteRecord from '../components/DeleteRecord.vue'
const wrappers: ReturnType<typeof mount>[] = []
let service = {
  id: 4,
  nome: 'Instalação',
  descricao: 'Configuração de equipamento',
  preco: 120,
  status: true,
}
const product = {
  id: 11,
  nome: 'Café exemplo',
  imagem: 'coffee.png',
  preco: 35.9,
  estoqueTotal: 12.25,
  totalVariantes: 2,
  variantePadraoId: 73,
  status: 'ATIVO',
  categoria: 'Mercearia',
}
async function open(component: Component, path = '/modofacil/produtos') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: path.split('?')[0], component },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  const workspace = createModalWorkspace(() => true)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      global: {
        plugins: [router],
        provide: { [modalWorkspaceKey as symbol]: workspace },
        stubs: {
          ModalView: {
            props: ['title', 'description'],
            template:
              '<div role="dialog"><h2>{{title}}</h2><p>{{description}}</p><slot name="header-actions"/><slot/><slot name="footer"/></div>',
          },
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, router, workspace }
}
const button = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text().trim() === text)!
beforeEach(() => {
  vi.resetAllMocks()
  mocks.ui.usuarioLogged.permissao = 'admin'
  product.status = 'ATIVO'
  service = {
    id: 4,
    nome: 'Instalação',
    descricao: 'Configuração de equipamento',
    preco: 120,
    status: true,
  }
  mocks.page.mockImplementation(async (path: string, params: any) => ({
    rows: path.endsWith('servicos')
      ? params.status && String(service.status) !== params.status
        ? []
        : [structuredClone(service)]
      : params.status && product.status !== params.status
        ? []
        : [structuredClone(product)],
    total: 1,
    pages: 1,
  }))
  mocks.patch.mockImplementation(async (path: string, body: any) => {
    const record = path.includes('/produtos/') ? product : service
    Object.assign(record, body)
    return record
  })
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('catálogo compacto do Modo Fácil', () => {
  it.each(['ATIVO', 'INATIVO'])(
    'ação rápida de produto %s pede confirmação e atualiza a situação da linha',
    async (status) => {
      product.status = status
      const { wrapper } = await open(ProductsPage)
      const action = wrapper.getComponent(RecordStatusAction)
      await action.get('button').trigger('click')
      expect(wrapper.get('[role=dialog]').text()).toContain('todas as suas variantes')
      expect(mocks.patch).not.toHaveBeenCalled()
      await button(
        wrapper,
        status === 'ATIVO' ? 'Confirmar desativação' : 'Confirmar ativação',
      ).trigger('click')
      await flushPromises()
      const next = status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
      expect(mocks.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/produtos/11/status', {
        status: next,
      })
      expect(wrapper.getComponent(RecordsTable).props('rows')[0].status).toBe(next)
      expect(action.get('button').attributes('aria-label')).toContain(
        next === 'ATIVO' ? 'Desativar' : 'Ativar',
      )
    },
  )
  it('cancelar não altera produto e salvar remove a linha do filtro de ativos', async () => {
    const { wrapper } = await open(ProductsPage, '/modofacil/produtos?status=ATIVO')
    await wrapper.getComponent(RecordStatusAction).get('button').trigger('click')
    await button(wrapper, 'Cancelar').trigger('click')
    expect(mocks.patch).not.toHaveBeenCalled()
    await wrapper.getComponent(RecordStatusAction).get('button').trigger('click')
    await button(wrapper, 'Confirmar desativação').trigger('click')
    await flushPromises()
    expect(mocks.page.mock.lastCall?.[1]).toMatchObject({ status: 'ATIVO' })
    expect(wrapper.getComponent(RecordsTable).props('rows')).toEqual([])
  })
  it.each(['usuario', 'vendedor', 'gerente'])(
    'oculta ação de produto para %s sem nível de produtos',
    async (role) => {
      mocks.ui.usuarioLogged.permissao = role
      const { wrapper } = await open(ProductsPage)
      expect(wrapper.find('[aria-label="Desativar produto Café exemplo"]').exists()).toBe(false)
    },
  )
  it('resposta incerta na situação do produto bloqueia também sua exclusão', async () => {
    const { wrapper } = await open(ProductsPage)
    await wrapper.getComponent(RecordStatusAction).get('button').trigger('click')
    mocks.patch.mockRejectedValueOnce(new Error('Conexão interrompida'))
    await button(wrapper, 'Confirmar desativação').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('resultado pode ter sido registrado')
    expect(wrapper.getComponent(DeleteRecord).get('button').attributes('disabled')).toBeDefined()
  })
  it('produtos usa tabela também no celular, com foto como primeira coluna e ações por registro', async () => {
    const { wrapper, workspace } = await open(ProductsPage)
    const table = wrapper.getComponent(RecordsTable)
    expect(table.props('mobileLayout')).toBe('table')
    expect(table.props('columns')[0].key).toBe('photo')
    expect(table.find('ul').exists()).toBe(false)
    expect(table.find('table').exists()).toBe(true)
    expect(table.getComponent(ProductPhoto).props('image')).toBe('coffee.png')
    await wrapper.get('[aria-label="Editar produto Café exemplo"]').trigger('click')
    expect(workspace.current.value?.target.params).toEqual({ produtoBaseId: 11 })
    expect(wrapper.findComponent(DeleteRecord).exists()).toBe(true)
  })
  it('abre a foto sem navegar e fecha pelo botão da visualização', async () => {
    const { wrapper, router } = await open(ProductsPage)
    await wrapper.get('[aria-label="Ver foto de Café exemplo"]').trigger('click')
    expect(router.currentRoute.value.path).toBe('/modofacil/produtos')
    expect(wrapper.get('[role=dialog] img').attributes('src')).toBe('/media/coffee.png')
    expect(wrapper.get('[role=dialog] img').attributes('alt')).toBe('Foto de Café exemplo')
    await button(wrapper, 'Fechar visualização').trigger('click')
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(mocks.patch).not.toHaveBeenCalled()
    expect(mocks.remove).not.toHaveBeenCalled()
  })
  it('mostra alternativa sem foto e recupera miniatura após mudar a imagem', async () => {
    const photo = mount(ProductPhoto, { props: { name: 'Produto', image: null } })
    wrappers.push(photo)
    expect(photo.find('button').exists()).toBe(false)
    expect(photo.get('[role=img]').attributes('aria-label')).toBe('Sem foto de Produto')
    await photo.setProps({ image: 'antiga.png' })
    await photo.get('img').trigger('error')
    expect(photo.get('[role=img]').attributes('aria-label')).toBe('Foto indisponível de Produto')
    await photo.setProps({ image: 'nova.png' })
    expect(photo.get('img').attributes('src')).toBe('/media/nova.png')
  })
  it('falha da imagem ampliada informa o problema e permite fechar', async () => {
    const { wrapper } = await open({
      render: () => h(ProductPhoto, { name: 'Produto', image: 'foto.png' }),
    })
    await wrapper.get('[data-product-photo]').trigger('click')
    await wrapper.get('[role=dialog] img').trigger('error')
    expect(wrapper.get('[role=status]').text()).toContain('Não foi possível carregar')
    await button(wrapper, 'Fechar visualização').trigger('click')
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
  })
  it.each([true, false])(
    'ação rápida de serviço %s envia boolean e recarrega a lista',
    async (status) => {
      service.status = status
      const { wrapper } = await open(ServicesPage, '/modofacil/servicos')
      const action = wrapper.findAllComponents(RecordStatusAction)[0]
      await action.get('button').trigger('click')
      expect(mocks.patch).not.toHaveBeenCalled()
      await button(wrapper, status ? 'Confirmar desativação' : 'Confirmar ativação').trigger(
        'click',
      )
      await flushPromises()
      expect(mocks.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/servicos/4/status', {
        status: !status,
      })
      expect(mocks.page).toHaveBeenCalledTimes(2)
      expect(wrapper.getComponent(RecordsTable).props('rows')[0].status).toBe(!status)
    },
  )
  it('oculta o fiscal para vendedor e permite editar o serviço no mesmo contexto', async () => {
    mocks.ui.usuarioLogged.permissao = 'vendedor'
    const { wrapper, workspace } = await open(ServicesPage, '/modofacil/servicos')
    expect(wrapper.find('[aria-label="Dados fiscais de Instalação"]').exists()).toBe(false)
    await wrapper.findAll('[aria-label="Editar serviço Instalação"]')[0].trigger('click')
    expect(workspace.current.value?.target.params).toEqual({ id: 4 })
    expect(wrapper.getComponent(RecordsTable).attributes('class')).toContain('[&_td]:!py-2')
  })
  it('desativação respeita o filtro e bloqueia exclusão após resposta incerta', async () => {
    const { wrapper } = await open(ServicesPage, '/modofacil/servicos?status=true')
    const action = wrapper.findAllComponents(RecordStatusAction)[0]
    await action.get('button').trigger('click')
    mocks.patch.mockRejectedValueOnce(new Error('Conexão interrompida'))
    await button(wrapper, 'Confirmar desativação').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('resultado pode ter sido registrado')
    expect(
      wrapper.findAllComponents(DeleteRecord)[0].get('button').attributes('disabled'),
    ).toBeDefined()
    await button(wrapper, 'Cancelar').trigger('click')
    expect(action.get('button').attributes('disabled')).toBeDefined()
    expect(mocks.patch).toHaveBeenCalledTimes(1)
  })
})
