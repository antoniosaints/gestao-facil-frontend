import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { h } from 'vue'
import CashPage from '../pages/CashPage.vue'
import { forms, type FormName } from '../application/formDialogs'
import {
  createModalWorkspace,
  modalFormKey,
  modalWorkspaceKey,
} from '../application/modalWorkspace'
import { confirmationKey } from '../application/confirmation'
import { Select } from '@/components/ui/select'
import FormSelect from '../components/FormSelect.vue'
import ItemSearch from '../components/ItemSearch.vue'
import CategoryPicker from '../components/CategoryPicker.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import * as demo from './previewFixtures'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
  confirm: vi.fn(),
}))
vi.mock('@/utils/axios', () => ({ default: http }))
vi.mock('@/stores/ui/uiStore', () => ({
  useUiStore: () => ({
    usuarioLogged: { id: 1, permissao: 'admin' },
    financeiroFlags: {},
    canCreateCharge: true,
    vendaLancamentoAutomatico: false,
    osLancamentoAutomatico: false,
  }),
}))
const wrappers: ReturnType<typeof mount>[] = []
const createdCategories: { id: number; nome: string }[] = []
beforeAll(async () => {
  await Promise.all(Object.values(forms).map((form) => form.component()))
}, 30000)
function read(path: string, config: any = {}) {
  const params = config.params || {}
  if (path === '/modofacil/configuracao') return { modo: 'FACIL', versao: 1, podeAlterar: true }
  if (path === '/modofacil/configuracoes/operacionais') return { data: {} }
  if (path.endsWith('/opcoes')) {
    const rows = path.includes('/contas/')
      ? demo.accounts
      : path.includes('/produtos/')
        ? [{ id: 2, nome: 'Mercearia' }, ...createdCategories]
        : demo.categories
    return {
      results: rows
        .filter((r) => params.id == null || r.id === Number(params.id))
        .map((r) => ({ id: r.id, label: r.nome })),
      hasMore: false,
    }
  }
  if (path.endsWith('/caixa/contexto'))
    return { data: { caixaAtivo: { id: 1 }, caixasAbertos: [], pdvs: [] } }
  if (path.endsWith('/caixa/resumo')) return { data: { resumo: {}, movimentos: [] } }
  if (path.endsWith('/edicao'))
    return {
      data: {
        registro: path.includes('/ordens/') ? demo.orders[0] : demo.sales[0],
        revisao: 'revision-1',
      },
    }
  if (path.endsWith('/variantes')) return { data: [demo.variant] }
  if (/\/produtos\/variantes\/\d+$/.test(path)) return { data: demo.variant }
  if (/\/produtos\/\d+$/.test(path)) return { data: demo.product }
  if (/\/financeiro\/lancamentos\/\d+$/.test(path)) return { data: demo.finance }
  if (path.endsWith('/cobrancas')) return { data: [] }
  if (/\/servicos\/ordens\/\d+$/.test(path)) return { data: demo.orders[0] }
  if (/\/vendas\/\d+$/.test(path)) return { data: demo.sales[0] }
  if (/\/pessoas\/\d+$/.test(path)) return { data: demo.people[0] }
  if (/\/servicos\/\d+$/.test(path)) return { data: demo.services[0] }
  const rows = path.includes('/pessoas')
    ? demo.people.filter((r) => !params.tipo || r.tipo === params.tipo)
    : path.includes('/servicos')
      ? demo.services
      : path.endsWith('/categorias')
        ? [{ id: 2, nome: 'Mercearia' }]
        : path.endsWith('/contas')
          ? demo.accounts
          : [demo.variant]
  return { data: rows, total: rows.length, totalPages: 1 }
}
beforeEach(() => {
  vi.resetAllMocks()
  createdCategories.splice(0)
  http.confirm.mockResolvedValue(true)
  http.get.mockImplementation(async (path, config) => ({
    data: structuredClone(read(path, config)),
  }))
  http.post.mockImplementation(async (path, body) => {
    if (path === '/modofacil/produtos/categorias') {
      const category = { id: 195, nome: body.nome }
      createdCategories.push(category)
      return { data: { data: category } }
    }
    return {
      data: {
        data:
          path.includes('/produtos') && !path.endsWith('/categorias')
            ? { produtoBaseId: 11, varianteId: 89, produto: demo.variant }
            : { id: 80, ...body },
      },
    }
  })
  http.patch.mockImplementation(async (_path, body) => ({ data: { data: { id: 80, ...body } } }))
  http.put.mockResolvedValue({ data: { data: { id: 80 } } })
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
async function open(
  name: FormName,
  params: Record<string, number | string> = {},
  query: Record<string, string> = {},
) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  await router.push(forms[name].background)
  const workspace = createModalWorkspace(() => true)
  workspace.open({ form: name, params, query }, forms[name].background)
  const wrapper = mount((await forms[name].component()).default, {
    attachTo: document.body,
    global: {
      plugins: [router],
      provide: {
        [modalFormKey as symbol]: workspace.current.value,
        [modalWorkspaceKey as symbol]: workspace,
        [confirmationKey as symbol]: http.confirm,
      },
    },
  })
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, workspace }
}
const label = (w: any, text: string) =>
  w.findAll('label').find((l: any) => l.text().trim().startsWith(text))!
const field = (w: any, text: string) => label(w, text).get('input,textarea')
const button = (w: any, text: string) =>
  w
    .findAll('button')
    .find((b: any) => b.text().trim() === text || b.attributes('aria-label') === text)!
async function choose(w: any, text: string, value: any) {
  await flushPromises()
  label(w, text)
    .getComponent(FormSelect)
    .getComponent(Select)
    .vm.$emit('update:modelValue', JSON.stringify(value))
  await flushPromises()
}
async function item(w: any, kind: string, id: number) {
  await flushPromises()
  const search = w
    .findAllComponents(ItemSearch)
    .find((c: any) => (c.props('kind') || 'PRODUTO') === kind)!
  search.getComponent(Select2Ajax).getComponent(Select).vm.$emit('update:modelValue', id)
  await flushPromises()
}
async function submit(w: any) {
  const form = w.get('form')
  expect((form.element as HTMLFormElement).checkValidity()).toBe(true)
  await form.trigger('submit')
  await flushPromises()
}
async function reviewSave(w: any) {
  await submit(w)
  await submit(w)
}

const retries: Array<[FormName, Record<string, number>]> = [
  ['produto-editar', { produtoBaseId: 11 }],
  ['variante-nova', { produtoBaseId: 11 }],
  ['servico-editar', { id: 4 }],
  ['financeiro-parcela', { id: 5, parcelaId: 8 }],
  ['financeiro-recorrencia', { id: 5 }],
  ['financeiro-cobranca-nova', {}],
  ['pessoa-editar', { id: 1 }],
]
describe('recuperação de leitura dos formulários', () => {
  it.each(retries)(
    '%s recupera os dados após falha sem liberar edição de dados vazios',
    async (name, params) => {
      http.get.mockRejectedValueOnce({
        response: { status: 503, data: { message: 'Leitura indisponível' } },
      })
      const { wrapper: w } = await open(
        name,
        params,
        name === 'financeiro-cobranca-nova' ? { tipo: 'venda', origem: '12' } : {},
      )
      expect(w.text()).toContain('Leitura indisponível')
      expect(
        w.find('form').exists() && w.find('form').find('fieldset:not([disabled])').exists(),
      ).toBe(false)
      const before = http.get.mock.calls.length
      await button(w, 'Tentar novamente').trigger('click')
      await flushPromises()
      expect(http.get.mock.calls.length).toBeGreaterThan(before)
      expect(w.text()).not.toContain('Leitura indisponível')
      expect(w.find('form').exists()).toBe(true)
      expect(http.post).not.toHaveBeenCalled()
    },
  )
})

describe('envio dos formulários e selects completos', () => {
  it('cadastra uma pessoa com o tipo escolhido no Select', async () => {
    const { wrapper: w } = await open('pessoa-nova')
    await field(w, 'Nome completo').setValue('Fornecedor de teste')
    await choose(w, 'Tipo de cadastro', 'FORNECEDOR')
    await submit(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/pessoas',
      expect.objectContaining({ nome: 'Fornecedor de teste', tipo: 'FORNECEDOR' }),
    )
    expect(w.text()).toContain('Pessoa cadastrada')
  })
  it('edita somente o contato alterado da pessoa', async () => {
    const { wrapper: w } = await open('pessoa-editar', { id: 1 })
    await field(w, 'Telefone').setValue('11999990000')
    await submit(w)
    expect(http.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/pessoas/1/basico', {
      telefone: '11999990000',
    })
  })
  it('altera tipo, situação e endereço da pessoa no formulário principal sem limpar outros campos', async () => {
    const { wrapper: w } = await open('pessoa-editar', { id: 1 })
    await choose(w, 'Tipo de cadastro', 'FORNECEDOR')
    await choose(w, 'Situação', 'INATIVO')
    await field(w, 'Endereço').setValue('Rua revisada')
    await submit(w)
    expect(http.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/pessoas/1/basico', {
      tipo: 'FORNECEDOR',
      status: 'INATIVO',
      endereco: 'Rua revisada',
    })
  })
  it('cadastra WhatsApp, situação, documento e endereço junto com os dados básicos', async () => {
    const { wrapper: w } = await open('pessoa-nova', {}, { tipo: 'FORNECEDOR' })
    await field(w, 'Nome completo').setValue('Fornecedor completo')
    await choose(w, 'Situação', 'INATIVO')
    await field(w, 'WhatsApp').setValue('11999990000')
    await field(w, 'CPF ou CNPJ').setValue('529.982.247-25')
    await field(w, 'CEP').setValue('86000-000')
    await field(w, 'Endereço').setValue('Rua Um')
    await submit(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/pessoas',
      expect.objectContaining({
        nome: 'Fornecedor completo',
        tipo: 'FORNECEDOR',
        status: 'INATIVO',
        whastapp: '11999990000',
        documento: '529.982.247-25',
        cep: '86000-000',
        endereco: 'Rua Um',
      }),
    )
  })
  it('cria uma variante com unidade pesquisável e estoque fracionado', async () => {
    const { wrapper: w } = await open('variante-nova', { produtoBaseId: 11 })
    await field(w, 'Nome da variante').setValue('Pacote 250 g')
    await choose(w, 'Unidade', 'kg')
    await field(w, 'Preço de venda').setValue('20,50')
    await field(w, 'Estoque inicial').setValue('0,250')
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/produtos/11/variantes',
      expect.objectContaining({
        nomeVariante: 'Pacote 250 g',
        unidade: 'kg',
        preco: 20.5,
        estoque: 0.25,
        precoCompra: null,
      }),
    )
    expect(w.text()).toContain('Variante #89')
  })
  it('grava lançamento com categoria e conta escolhidas no SelectAjax', async () => {
    const { wrapper: w } = await open('lancamento-novo')
    await field(w, 'Descrição').setValue('Despesa de teste')
    await field(w, 'Valor').setValue('123,45')
    await choose(w, 'Categoria', 3)
    await choose(w, 'Conta financeira', 2)
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/financeiro/lancamentos',
      expect.objectContaining({ valorTotal: 123.45, categoriaId: 3, contasFinanceiroId: 2 }),
    )
    expect(w.text()).toContain('Lançamento registrado')
  })
  it('altera categoria financeira mantendo valor e parcelas fora do payload', async () => {
    const { wrapper: w } = await open('lancamento-editar', { id: 5 })
    await choose(w, 'Categoria', 4)
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/financeiro/lancamentos/5/atualizar-basico',
      expect.objectContaining({ categoriaId: 4, contasFinanceiroId: 2 }),
    )
    expect(http.post.mock.calls[0]![1]).not.toHaveProperty('valorTotal')
  })
  it('adiciona parcela com a conta selecionada', async () => {
    const { wrapper: w } = await open('financeiro-parcela', { id: 5 })
    await field(w, 'Valor da parcela').setValue('33,25')
    await choose(w, 'Conta', 3)
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/financeiro/lancamentos/5/parcelas',
      expect.objectContaining({ valor: 33.25, contaFinanceira: 3 }),
    )
  })
  it('edita parcela pelo escopo escolhido', async () => {
    const { wrapper: w } = await open('financeiro-parcela', { id: 5, parcelaId: 8 })
    await field(w, 'Valor da parcela').setValue('50')
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/financeiro/parcelas/8/atualizar',
      expect.objectContaining({ valor: 50, escopo: 'ATUAL' }),
    )
  })
  it('configura recorrência usando frequência e valores do formulário', async () => {
    const { wrapper: w } = await open('financeiro-recorrencia', { id: 5 })
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/financeiro/lancamentos/5/recorrencia',
      expect.objectContaining({ frequencia: 'MENSAL', valorParcela: 420 }),
    )
  })
  it('confirma transferência entre duas contas do SelectAjax', async () => {
    const { wrapper: w } = await open('financeiro-transferir')
    await choose(w, 'Conta de origem', 2)
    await choose(w, 'Conta de destino', 3)
    await field(w, 'Valor').setValue('25')
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/financeiro/transferencias',
      expect.objectContaining({ contaOrigemId: 2, contaDestinoId: 3, valor: 25 }),
    )
  })
  it('cria cobrança vinculada à venda e ao tipo escolhido', async () => {
    http.post.mockResolvedValueOnce({
      data: { data: { id: 80, pixCopiaCola: 'pix-ficticio-da-cobranca' } },
    })
    const { wrapper: w } = await open(
      'financeiro-cobranca-nova',
      {},
      { tipo: 'venda', origem: '12' },
    )
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/financeiro/cobrancas',
      expect.objectContaining({ type: 'PIX', value: 420, vinculo: { id: 12, tipo: 'venda' } }),
    )
    expect((w.get('textarea[readonly]').element as HTMLTextAreaElement).value).toBe(
      'pix-ficticio-da-cobranca',
    )
  })
  it('faz reposição fracionada com confirmação e fornecedor do SelectAjax', async () => {
    const { wrapper: w } = await open('estoque', { operacao: 'reposicao' }, { produtoId: '73' })
    await field(w, 'Quantidade').setValue('0,500')
    await field(w, 'Custo unitário').setValue('12,50')
    await item(w, 'PESSOA', 6)
    await submit(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/estoque/reposicao',
      expect.objectContaining({ produtoId: 73, quantidade: 0.5, fornecedor: 6 }),
    )
  })
  it('mostra saldo e custo previstos sem valores inválidos quando a quantidade está vazia', async () => {
    const { wrapper: w } = await open('estoque', { operacao: 'reposicao' }, { produtoId: '73' })
    const preview = () => w.get('[aria-label="Prévia do saldo"]').text()
    expect(preview()).toContain('Saldo atual12,25')
    expect(preview()).toMatch(/Saldo previsto\s*—/)
    expect(w.text()).not.toContain('NaN')
    await field(w, 'Quantidade').setValue('0,125')
    await field(w, 'Custo unitário').setValue('12,50')
    await field(w, 'Frete').setValue('2,50')
    await field(w, 'Desconto').setValue('0,50')
    expect(preview()).toMatch(/Saldo previsto\s*12,375/)
    expect(w.get('[aria-label="Resumo do custo da entrada"]').text()).toMatch(/R\$\s*3,56/)
    await field(w, 'Quantidade').setValue('1,0001')
    expect(preview()).toMatch(/Saldo previsto\s*—/)
    expect(w.get('[aria-label="Resumo do custo da entrada"]').text()).toContain('—')
    expect(http.post).not.toHaveBeenCalled()
  })
  it('limpa dados da compra ao trocar o produto e depois de registrar uma entrada', async () => {
    const { wrapper: w } = await open('estoque', { operacao: 'reposicao' }, { produtoId: '73' })
    await field(w, 'Quantidade').setValue('2')
    await field(w, 'Custo unitário').setValue('20')
    await item(w, 'PESSOA', 6)
    await field(w, 'Nota fiscal').setValue('NF anterior')
    await field(w, 'Frete').setValue('7')
    await button(w, 'Trocar').trigger('click')
    await item(w, 'PRODUTO', 73)
    expect((field(w, 'Quantidade').element as HTMLInputElement).value).toBe('')
    expect((field(w, 'Nota fiscal').element as HTMLInputElement).value).toBe('')
    expect((field(w, 'Frete').element as HTMLInputElement).value).toBe('0')
    expect(button(w, 'Remover fornecedor')).toBeUndefined()
    await field(w, 'Quantidade').setValue('1')
    await field(w, 'Custo unitário').setValue('0')
    await item(w, 'PESSOA', 6)
    await field(w, 'Nota fiscal').setValue('NF nova')
    await submit(w)
    await item(w, 'PRODUTO', 73)
    expect((field(w, 'Nota fiscal').element as HTMLInputElement).value).toBe('')
    expect(button(w, 'Remover fornecedor')).toBeUndefined()
  })
  it('mantém os dados quando a conferência é cancelada e impede reenvio incerto', async () => {
    const { wrapper: w } = await open('estoque', { operacao: 'reposicao' }, { produtoId: '73' })
    await field(w, 'Quantidade').setValue('1')
    await field(w, 'Custo unitário').setValue('50')
    http.confirm.mockResolvedValueOnce(false)
    await submit(w)
    expect(http.post).not.toHaveBeenCalled()
    expect((field(w, 'Quantidade').element as HTMLInputElement).value).toBe('1')
    http.post.mockRejectedValueOnce(new Error('Conexão interrompida'))
    await submit(w)
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(w.text()).toContain('Confira o histórico antes de iniciar outra operação')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(button(w, 'Trocar').element.matches(':disabled')).toBe(true)
  })
  it('recusa transferência para a mesma conta antes de qualquer envio', async () => {
    const { wrapper: w } = await open('financeiro-transferir')
    await choose(w, 'Conta de origem', 2)
    await choose(w, 'Conta de destino', 2)
    await field(w, 'Valor').setValue('25')
    await submit(w)
    expect(w.text()).toContain('contas de origem e destino diferentes')
    expect(http.post).not.toHaveBeenCalled()
  })
})

async function orderDraft(w: any) {
  await item(w, 'PESSOA', 1)
  await button(w, 'Continuar').trigger('click')
  await choose(w, 'O que deseja incluir?', 'SERVICO')
  await item(w, 'SERVICO', 4)
  await button(w, 'Continuar').trigger('click')
  await flushPromises()
}
describe('vendas, OS, estoque e informações adicionais', () => {
  it('conclui venda com produto e pessoa escolhidos nos seletores reais', async () => {
    const { wrapper: w } = await open('venda-nova')
    await item(w, 'PRODUTO', 73)
    await button(w, 'Continuar').trigger('click')
    await item(w, 'PESSOA', 1)
    await button(w, 'Continuar').trigger('click')
    await button(w, 'Confirmar e concluir venda').trigger('click')
    await flushPromises()
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/vendas/caixa/finalizar-venda',
      expect.objectContaining({
        clienteId: 1,
        caixaId: 1,
        pagamento: 'PIX',
        itens: [expect.objectContaining({ id: 73, quantidade: 1, preco: 35.9 })],
      }),
    )
  })
  it('abre OS com cliente, serviço e desconto sem faturar automaticamente', async () => {
    const { wrapper: w } = await open('ordem-nova')
    await orderDraft(w)
    await field(w, 'Desconto').setValue('10')
    await button(w, 'Confirmar abertura da OS').trigger('click')
    await flushPromises()
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/servicos/ordens',
      expect.objectContaining({
        clienteId: 1,
        desconto: 10,
        status: 'ABERTA',
        itens: [expect.objectContaining({ id: 4, tipo: 'SERVICO', valor: 120 })],
      }),
    )
  })
  it.each([
    ['venda-editar', { id: 12 }, 'Observações', '/modofacil/vendas/12/edicao', 'observacoes'],
    [
      'ordem-editar',
      { id: 15 },
      'Descrição interna',
      '/modofacil/servicos/ordens/15/edicao',
      'descricao',
    ],
  ] as const)(
    'edita %s com a revisão e sem reenviar itens inalterados',
    async (name, params, text, path, key) => {
      const { wrapper: w } = await open(name, params)
      await field(w, text).setValue('Observação revisada')
      await button(w, 'Continuar').trigger('click')
      await button(w, 'Continuar').trigger('click')
      await button(w, 'Salvar alterações revisadas').trigger('click')
      await flushPromises()
      expect(http.patch).toHaveBeenCalledExactlyOnceWith(path, {
        revisao: 'revision-1',
        [key]: 'Observação revisada',
      })
    },
  )
  it('confirma descarte e envia o motivo sem criar reposição', async () => {
    const { wrapper: w } = await open('estoque', { operacao: 'descarte' }, { produtoId: '73' })
    await field(w, 'Quantidade').setValue('0,125')
    await field(w, 'Motivo').setValue('Avaria')
    await submit(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith('/modofacil/estoque/descarte', {
      produtoId: 73,
      quantidade: 0.125,
      motivo: 'Avaria',
    })
  })
  it('registra reposição em lote com custo, quantidade e fornecedor', async () => {
    const { wrapper: w } = await open('estoque-lote')
    await item(w, 'PRODUTO', 73)
    await field(w, 'Quantidade 1').setValue('0,5')
    await field(w, 'Custo unitário 1').setValue('10,25')
    await item(w, 'PESSOA', 6)
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/estoque/reposicao/lote',
      expect.objectContaining({
        fornecedor: 6,
        itens: [{ produtoId: 73, quantidade: 0.5, custo: 10.25 }],
      }),
    )
  })
  it.each([
    ['produto-avancado', { produtoBaseId: 11 }, '/modofacil/produtos/11/avancado'],
    [
      'variante-avancado',
      { produtoBaseId: 11, varianteId: 73 },
      '/modofacil/produtos/11/variantes/73/avancado',
    ],
    ['servico-avancado', { id: 4 }, '/modofacil/servicos/4/avancado'],
  ] as const)('envia apenas o campo fiscal alterado em %s', async (name, params, path) => {
    const { wrapper: w } = await open(name, params)
    await field(w, 'NCM').setValue('12345678')
    await reviewSave(w)
    expect(http.patch).toHaveBeenCalledExactlyOnceWith(path, { ncm: '12345678' })
  })
  it('salva o tipo da pessoa nas informações adicionais pelo Select', async () => {
    const { wrapper: w } = await open('pessoa-avancado', { id: 1 })
    await choose(w, 'Tipo de pessoa', 'FORNECEDOR')
    await reviewSave(w)
    expect(http.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/pessoas/1/avancado', {
      tipo: 'FORNECEDOR',
    })
  })
  it('preserva a categoria escolhida quando o usuário recusa descartar o produto', async () => {
    const { wrapper: w, workspace } = await open('produto-editar', { produtoBaseId: 11 })
    http.confirm.mockResolvedValue(false)
    w.getComponent(CategoryPicker)
      .getComponent(Select2Ajax)
      .getComponent(Select)
      .vm.$emit('update:modelValue', 2)
    await flushPromises()
    // A real change: clear the existing category before attempting to leave.
    w.getComponent(CategoryPicker).getComponent(Select2Ajax).vm.$emit('update:modelValue', null)
    await flushPromises()
    expect(await workspace.close()).toBe(false)
    expect(http.confirm).toHaveBeenCalledOnce()
  })
})

describe('validações e proteção contra envio repetido', () => {
  it('permite corrigir desconto inválido da OS sem tratar erro local como envio incerto', async () => {
    const { wrapper: w } = await open('ordem-nova')
    await orderDraft(w)
    await field(w, 'Desconto').setValue('-1')
    await button(w, 'Confirmar abertura da OS').trigger('click')
    await flushPromises()
    expect(http.post).not.toHaveBeenCalled()
    expect(button(w, 'Confirmar abertura da OS').attributes('disabled')).toBeUndefined()
    await field(w, 'Desconto').setValue('0')
    await button(w, 'Confirmar abertura da OS').trigger('click')
    await flushPromises()
    expect(http.post).toHaveBeenCalledOnce()
  })
  it('recusa desconto maior que os itens antes de enviar a OS', async () => {
    const { wrapper: w } = await open('ordem-nova')
    await orderDraft(w)
    await field(w, 'Desconto').setValue('121')
    await button(w, 'Confirmar abertura da OS').trigger('click')
    await flushPromises()
    expect(http.post).not.toHaveBeenCalled()
    expect(w.text()).toContain('desconto')
  })
  it.each(['pessoa-nova', 'servico-novo'] as const)(
    '%s bloqueia repetição após resposta 500',
    async (name) => {
      http.post.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Falha depois do envio' } },
      })
      const { wrapper: w } = await open(name)
      await field(w, name === 'pessoa-nova' ? 'Nome completo' : 'Nome').setValue(
        'Cadastro de teste',
      )
      if (name === 'servico-novo') await field(w, 'Preço').setValue('20')
      await submit(w)
      expect((w.get('fieldset').element as HTMLFieldSetElement).disabled).toBe(true)
      await w.get('form').trigger('submit')
      await flushPromises()
      expect(http.post).toHaveBeenCalledOnce()
    },
  )
  it('mantém os selects de pagamento válidos para depósito ao editar e criar lançamentos', async () => {
    const { wrapper: w } = await open('lancamento-novo')
    const payment = label(w, 'Forma de pagamento').getComponent(FormSelect)
    expect(payment.props('options').some((o: any) => o.value === 'DEPOSITO')).toBe(true)
  })
})

async function page(component: any, path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path, component }] })
  await router.push(path)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      attachTo: document.body,
      global: {
        plugins: [router],
        stubs: {
          ModalView: {
            props: ['title'],
            template:
              '<div role="dialog"><h2>{{ title }}</h2><slot name="header-actions" /><slot /><slot name="footer" /></div>',
          },
        },
        provide: { [confirmationKey as symbol]: http.confirm },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}
describe('caixa, cadastros e configurações', () => {
  it('abre o movimento de caixa com uma operação válida já selecionada', async () => {
    const w = await page(CashPage, '/caixa')
    await button(w, 'Adicionar dinheiro').trigger('click')
    await flushPromises()
    expect(w.text()).not.toContain('A opção selecionada não está disponível')
    expect(label(w, 'Operação').get('[role=combobox]').text()).toBe('Reforço de dinheiro')
  })
  it.each(['REFORCO', 'SANGRIA', 'fechar'])(
    'confirma %s pelo contrato de caixa',
    async (operation) => {
      const w = await page(CashPage, '/caixa')
      await button(w, 'Adicionar dinheiro').trigger('click')
      await flushPromises()
      await choose(w, 'Operação', operation)
      await field(w, operation === 'fechar' ? 'Valor contado' : 'Valor').setValue('50')
      await submit(w)
      if (operation === 'fechar')
        expect(http.put).toHaveBeenCalledExactlyOnceWith(
          '/modofacil/vendas/caixa/fechar',
          expect.objectContaining({ caixaId: 1, valorFechamento: 50 }),
        )
      else
        expect(http.post).toHaveBeenCalledExactlyOnceWith(
          '/modofacil/vendas/caixa/movimentar',
          expect.objectContaining({ caixaId: 1, tipoMovimento: operation, valor: 50 }),
        )
    },
  )
  it('abre caixa com o terminal escolhido no Select', async () => {
    http.get.mockImplementation(async (path, config) => ({
      data: path.endsWith('/caixa/contexto')
        ? {
            data: {
              caixaAtivo: null,
              caixasAbertos: [],
              pdvs: [{ id: 9, nome: 'Terminal principal' }],
            },
          }
        : read(path, config),
    }))
    const w = await page(CashPage, '/caixa')
    await button(w, 'Abrir caixa').trigger('click')
    await flushPromises()
    await choose(w, 'Terminal', 9)
    await field(w, 'Saldo inicial').setValue('100')
    await submit(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/vendas/caixa/abrir',
      expect.objectContaining({ pdvId: 9, valorInicial: 100 }),
    )
  })
  it('não envia movimento quando a confirmação é cancelada', async () => {
    http.confirm.mockResolvedValue(false)
    const w = await page(CashPage, '/caixa')
    await button(w, 'Adicionar dinheiro').trigger('click')
    await flushPromises()
    await choose(w, 'Operação', 'REFORCO')
    await field(w, 'Valor').setValue('50')
    await submit(w)
    expect(http.post).not.toHaveBeenCalled()
  })
  it('impede repetir movimento de caixa depois de resposta 500', async () => {
    http.post.mockRejectedValueOnce({ response: { status: 500 } })
    const w = await page(CashPage, '/caixa')
    await button(w, 'Adicionar dinheiro').trigger('click')
    await flushPromises()
    await choose(w, 'Operação', 'REFORCO')
    await field(w, 'Valor').setValue('50')
    await submit(w)
    expect((w.get('fieldset').element as HTMLFieldSetElement).disabled).toBe(true)
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(http.post).toHaveBeenCalledOnce()
  })
  it('cadastra serviço pelo fluxo novo', async () => {
    const { wrapper: w } = await open('servico-novo')
    await field(w, 'Nome').setValue('Instalação de teste')
    await field(w, 'Preço').setValue('80,50')
    await submit(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/servicos',
      expect.objectContaining({ nome: 'Instalação de teste', preco: 80.5 }),
    )
    expect(w.text()).toContain('Serviço salvo')
  })
  it('permite criar um serviço inativo usando o switch padrão', async () => {
    const { wrapper: w } = await open('servico-novo')
    await field(w, 'Nome').setValue('Serviço em preparação')
    await field(w, 'Preço').setValue('90,50')
    await w.get('[role=switch]').trigger('click')
    await submit(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith('/modofacil/servicos', {
      nome: 'Serviço em preparação',
      preco: 90.5,
      descricao: null,
      status: false,
    })
  })
  it('salva nome e situação do serviço em uma única edição parcial', async () => {
    const { wrapper: w } = await open('servico-editar', { id: 4 })
    await field(w, 'Nome').setValue('Instalação revisada')
    await w.get('[role=switch]').trigger('click')
    await submit(w)
    expect(http.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/servicos/4/basico', {
      nome: 'Instalação revisada',
      status: false,
    })
    expect(http.post).not.toHaveBeenCalled()
  })
  it('valida o valor financeiro antes de entrar na revisão e permite correção', async () => {
    const { wrapper: w } = await open('lancamento-novo')
    await field(w, 'Descrição').setValue('Teste')
    await field(w, 'Valor').setValue('0')
    await choose(w, 'Categoria', 3)
    await choose(w, 'Conta financeira', 2)
    await submit(w)
    expect(w.text()).toContain('Informe um valor maior que zero')
    expect(w.text()).not.toContain('Confira o lançamento')
    await field(w, 'Valor').setValue('25')
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledOnce()
  })
  it('escolhe depósito no cadastro de lançamento sem perder o valor do enum', async () => {
    const { wrapper: w } = await open('lancamento-novo')
    await field(w, 'Descrição').setValue('Depósito de teste')
    await field(w, 'Valor').setValue('25')
    await choose(w, 'Categoria', 3)
    await choose(w, 'Conta financeira', 2)
    await choose(w, 'Forma de pagamento', 'DEPOSITO')
    await reviewSave(w)
    expect(http.post.mock.calls[0]![1].formaPagamento).toBe('DEPOSITO')
  })
  it('salva apenas a conta padrão alterada nas configurações operacionais', async () => {
    const component = (await import('../pages/SettingsPage.vue')).default
    const w = await page(component, '/configuracoes')
    await button(w, 'Vendas, dinheiro, OS e avisos').trigger('click')
    await flushPromises()
    await choose(w, 'Conta financeira padrão', 2)
    await reviewSave(w)
    expect(http.patch).toHaveBeenCalledExactlyOnceWith('/modofacil/configuracoes/operacionais', {
      contaFinanceiraPadraoId: 2,
    })
  })
  it.each(['contas', 'categorias'])('cadastra %s financeiras pelo modal', async (kind) => {
    const component = (await import('../pages/FinanceCatalogsPage.vue')).default
    const w = await page(component, '/cadastros')
    if (kind === 'categorias') {
      await button(w, 'Categorias').trigger('click')
      await flushPromises()
    }
    await button(w, kind === 'contas' ? 'Nova conta financeira' : 'Nova categoria').trigger('click')
    await flushPromises()
    await field(w, 'Nome').setValue('Cadastro de teste')
    if (kind === 'categorias') await choose(w, 'Categoria superior', 3)
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      `/modofacil/financeiro/${kind}`,
      expect.objectContaining(
        kind === 'contas'
          ? { nome: 'Cadastro de teste', saldoInicial: 0 }
          : { nome: 'Cadastro de teste', categoriaPai: 3 },
      ),
    )
  })
})

describe('modalidades financeiras e validações finais', () => {
  async function financial() {
    const result = await open('lancamento-novo')
    await field(result.wrapper, 'Descrição').setValue('Modalidade de teste')
    await field(result.wrapper, 'Valor').setValue('100')
    await choose(result.wrapper, 'Categoria', 3)
    await choose(result.wrapper, 'Conta financeira', 2)
    return result.wrapper
  }
  it('envia parcelamento com intervalo personalizado, entrada e desconto', async () => {
    const w = await financial()
    await choose(w, 'Como será o lançamento?', 'PARCELADO')
    await field(w, 'Quantidade de parcelas').setValue('3')
    await choose(w, 'Intervalo', 'PERSONALIZADO')
    await field(w, 'Dias de intervalo').setValue('15')
    await field(w, 'Entrada').setValue('10')
    await field(w, 'Desconto').setValue('5')
    await reviewSave(w)
    expect(http.post.mock.calls[0]![1]).toMatchObject({
      tipoLancamentoModo: 'PARCELADO',
      parcelas: 3,
      periodoParcelamento: 'PERSONALIZADO',
      intervaloDiasPersonalizado: 15,
      valorEntrada: 10,
      desconto: 5,
    })
  })
  it('envia a configuração da recorrência na mesma operação', async () => {
    const w = await financial()
    await choose(w, 'Como será o lançamento?', 'RECORRENTE')
    await choose(w, 'Frequência', 'SEMANAL')
    await field(w, 'Valor de cada ocorrência').setValue('25')
    await reviewSave(w)
    expect(http.post.mock.calls[0]![1]).toMatchObject({
      tipoLancamentoModo: 'RECORRENTE',
      recorrencia: { frequencia: 'SEMANAL', valorParcela: 25 },
    })
  })
  it('ignora valores de parcelamento ocultos após mudar para parcela única', async () => {
    const w = await financial()
    await choose(w, 'Como será o lançamento?', 'PARCELADO')
    await field(w, 'Desconto').setValue('inválido')
    await choose(w, 'Como será o lançamento?', 'AVISTA')
    await reviewSave(w)
    expect(http.post).toHaveBeenCalledOnce()
    expect(http.post.mock.calls[0]![1]).not.toHaveProperty('desconto')
  })
  it('pede uma nova data da OS sem bloquear o formulário quando a data está vazia', async () => {
    const { wrapper: w } = await open('ordem-nova')
    await orderDraft(w)
    await field(w, 'Data de abertura').setValue('')
    await button(w, 'Confirmar abertura da OS').trigger('click')
    await flushPromises()
    expect(http.post).not.toHaveBeenCalled()
    expect(w.text()).toContain('Informe a data de abertura')
    expect(button(w, 'Confirmar abertura da OS').attributes('disabled')).toBeUndefined()
  })
  it('recusa quantidade fracionada na venda antes da revisão e do envio', async () => {
    const { wrapper: w } = await open('venda-nova')
    await item(w, 'PRODUTO', 73)
    await field(w, 'Quantidade').setValue('0.5')
    await button(w, 'Continuar').trigger('click')
    await flushPromises()
    expect(w.findAll('[aria-current="step"]')[0]!.text()).toContain('Itens')
    expect(http.post).not.toHaveBeenCalled()
  })
  it('oferece pesquisa do depósito no select mantendo o rótulo legível', async () => {
    const w = await financial()
    await choose(w, 'Forma de pagamento', 'DEPOSITO')
    expect(label(w, 'Forma de pagamento').get('[role=combobox]').text()).toBe('Depósito')
  })
  it('exige cliente no crediário e permite corrigir antes de concluir a venda', async () => {
    const { wrapper: w } = await open('venda-nova')
    await item(w, 'PRODUTO', 73)
    await button(w, 'Continuar').trigger('click')
    await choose(w, 'Forma de pagamento', 'CREDIARIO')
    await field(w, 'Parcelas do crediário').setValue('3')
    await field(w, 'Primeiro vencimento').setValue('2026-12-15')
    await button(w, 'Continuar').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('Para vender a prazo, escolha cliente')
    expect(http.post).not.toHaveBeenCalled()
    await item(w, 'PESSOA', 1)
    await button(w, 'Continuar').trigger('click')
    await button(w, 'Confirmar e concluir venda').trigger('click')
    await flushPromises()
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/vendas/caixa/finalizar-venda',
      expect.objectContaining({
        clienteId: 1,
        pagamento: 'CREDIARIO',
        crediarioParcelas: 3,
        crediarioPrimeiroVencimento: '2026-12-15',
      }),
    )
  })
  it.each(['gerar', 'pausar', 'retomar', 'encerrar'])(
    'envia a ação %s escolhida no select da recorrência',
    async (action) => {
      http.get.mockImplementation(async (path, config) => ({
        data: structuredClone(
          /\/financeiro\/lancamentos\/5$/.test(path)
            ? {
                data: {
                  ...demo.finance,
                  recorrencia: {
                    frequencia: 'MENSAL',
                    ativo: action !== 'retomar',
                    valorParcela: 50,
                  },
                },
              }
            : read(path, config),
        ),
      }))
      const { wrapper: w } = await open('financeiro-recorrencia', { id: 5 })
      await choose(w, 'O que deseja fazer?', action)
      await reviewSave(w)
      expect(http.post).toHaveBeenCalledExactlyOnceWith(
        `/modofacil/financeiro/lancamentos/5/recorrencia/${action === 'gerar' ? 'gerar' : 'status'}`,
        action === 'gerar' ? {} : { ativo: action === 'retomar', encerrar: action === 'encerrar' },
      )
    },
  )
  it('confere a quantidade afetada antes de mover vínculos financeiros filtrados', async () => {
    http.post.mockResolvedValueOnce({
      data: { data: { preview: { parcelasAfetadas: 2, lancamentosAfetados: 1 } } },
    })
    const { wrapper: w } = await open('financeiro-transferir')
    await choose(w, 'Operação', 'MOVER_LANCAMENTOS')
    await choose(w, 'Conta de origem', 2)
    await choose(w, 'Conta de destino', 3)
    await choose(w, 'Situação', 'PENDENTE')
    await choose(w, 'Tipo', 'DESPESA')
    await field(w, 'Busca').setValue('aluguel')
    const filtros = { status: 'PENDENTE', tipo: 'DESPESA', search: 'aluguel' }
    await submit(w)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/financeiro/transferencias/preview',
      { contaOrigemId: 2, filtros },
    )
    expect(w.text()).toContain('2 parcela(s) e 1 lançamento(s)')
    await submit(w)
    expect(http.post).toHaveBeenLastCalledWith('/modofacil/financeiro/transferencias', {
      modo: 'MOVER_LANCAMENTOS',
      contaOrigemId: 2,
      contaDestinoId: 3,
      filtros,
    })
    expect(w.text()).toContain('Transferência registrada')
  })
})
