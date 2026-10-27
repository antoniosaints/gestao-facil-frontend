import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { h } from 'vue'
const domain = vi.hoisted(() => ({
  page: vi.fn(),
  read: vi.fn(),
  create: vi.fn(),
  photo: vi.fn(),
  get: vi.fn(),
  variants: vi.fn(),
  update: vi.fn(),
}))
vi.mock('../adapters/domain', () => ({ api: { page: domain.page, read: domain.read }, products: domain }))
import ProductFormPage from '../pages/ProductFormPage.vue'
const wrappers: any[] = []
async function form(path = '/modofacil/produtos/novo') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/modofacil/produtos', component: { template: '<div>Lista</div>' } },
      { path: '/modofacil/produtos/:produtoBaseId', component: { template: '<div>Detalhe</div>' } },
      { path: '/modofacil/produtos/novo', component: ProductFormPage },
      {
        path: '/modofacil/produtos/:produtoBaseId/variantes/:varianteId',
        component: ProductFormPage,
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  const w = mount({ render: () => h(RouterView) }, { global: { plugins: [router] } })
  wrappers.push(w)
  await flushPromises()
  return w
}
async function fill(w: any) {
  const controls = w.findAll('input')
  await controls[0].setValue('Café')
  await w.find('form').trigger('submit')
  await w
    .findAll('label')
    .find((label: any) => label.text().trim().startsWith('Preço de venda'))!
    .find('input')
    .setValue('35,90')
  await w
    .findAll('label')
    .find((label: any) => label.text().trim().startsWith('Estoque atual'))!
    .find('input')
    .setValue('0,250')
  await w.find('form').trigger('submit')
}
beforeEach(() => {
  vi.clearAllMocks()
  domain.read.mockResolvedValue({ results: [], hasMore: false })
  domain.page.mockResolvedValue({ rows: [], total: 0, pages: 1 })
  domain.create.mockResolvedValue({ produtoBaseId: 11, varianteId: 73, produto: {} })
  domain.photo.mockResolvedValue({})
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('cadastro guiado', () => {
  it('converte frações e diferencia custo desconhecido de zero', async () => {
    const w = await form()
    expect(w.text()).not.toContain('Valor inválido')
    await fill(w)
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(domain.create).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Café', estoque: 0.25, preco: 35.9, precoCompra: null }),
      expect.any(String),
    )
    expect(w.text()).toContain('Variante #73')
  })
  it('reenvia apenas foto após salvar usando o ID da variante', async () => {
    const w = await form()
    await fill(w)
    const input = w.get('input[type=file]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['png'], 'foto.png', { type: 'image/png' })],
    })
    await input.trigger('change')
    domain.photo.mockRejectedValueOnce(new Error('offline'))
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(domain.create).toHaveBeenCalledTimes(1)
    expect(w.text()).toContain('Produto salvo; a foto não foi enviada')
    const retry = w.findAll('button').find((b: any) => b.text() === 'Reenviar somente a foto')
    await retry!.trigger('click')
    await flushPromises()
    expect(domain.create).toHaveBeenCalledTimes(1)
    expect(domain.photo).toHaveBeenCalledTimes(2)
    expect(domain.photo.mock.calls[0]![0]).toBe(73)
  })
  it('mantém a chave e o preenchimento após erro de rede no cadastro', async () => {
    domain.create.mockRejectedValueOnce(new Error('offline'))
    const w = await form()
    await fill(w)
    await w.find('form').trigger('submit')
    await flushPromises()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(domain.create.mock.calls[0]![1]).toBe(domain.create.mock.calls[1]![1])
    expect(domain.create).toHaveBeenCalledTimes(2)
  })
  it('edição usa base/variante corretos e não envia estoque ou campos sem alteração', async () => {
    domain.get.mockResolvedValue({ id: 11, nome: 'Café', categoriaId: null, descricao: null })
    domain.variants.mockResolvedValue([
      {
        id: 73,
        produtoBaseId: 11,
        preco: '30.00',
        precoCompra: null,
        estoque: '0.250',
        minimo: '0',
        unidade: 'kg',
      },
    ])
    domain.update.mockResolvedValue({ produtoBaseId: 11, varianteId: 73, produto: {} })
    const w = await form('/modofacil/produtos/11/variantes/73')
    await w.find('form').trigger('submit')
    const stockInput = w
      .findAll('label')
      .find((label: any) => label.text().trim().startsWith('Estoque atual'))!
      .find('input')
    await w
      .findAll('label')
      .find((label: any) => label.text().trim().startsWith('Preço de venda'))!
      .find('input')
      .setValue('32,50')
    await w.find('form').trigger('submit')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(domain.update).toHaveBeenCalledWith(11, 73, { preco: 32.5 })
    expect(stockInput.attributes('readonly')).toBeDefined()
  })
  it('mantém formulário e rota quando a saída com alterações é recusada', async () => {
    const w = await form()
    await w.find('input').setValue('Produto em andamento')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await (w.vm as any).$router.push('/modofacil/produtos')
    expect(confirm).toHaveBeenCalledOnce()
    expect(w.find('input').element.value).toBe('Produto em andamento')
    confirm.mockRestore()
  })
})
