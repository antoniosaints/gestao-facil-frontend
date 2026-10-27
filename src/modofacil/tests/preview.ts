// Isolated harness: all HTTP responses are in memory; sockets use previewSocket.
import { createApp, h } from 'vue'
import '@/assets/style.css'
import { setThemeCustomization } from '@/utils/theme'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { createToastContainer } from '@/utils/toastContainer'
import http from '@/utils/axios'
import { useUiStore } from '@/stores/ui/uiStore'
import { experience } from '../application/experience'
import { modoFacilRoutes } from '../routes'
import * as demo from './previewFixtures'
import { cashSession, cashSummary } from './previewCash'
import { financeRows, financePreviewSummary, financePreviewPage } from './previewFinance'
import { forms, type FormName, type FormTarget } from '../application/formDialogs'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
const scenario = new URLSearchParams(location.search).get('scenario')
const palette = new URLSearchParams(location.search).get('palette')
const previewProductCategories = [{ id: 2, nome: 'Mercearia' }]
const failedReads = new Set<string>()
const deletedRecords = new Set<string>()
if (palette === 'warm')
  setThemeCustomization({ fundoDark: '#291A11', sidebarDark: '#713F12', primariaDark: '#EA580C' })
if (palette === 'violet')
  setThemeCustomization({ fundoDark: '#2E1065', sidebarDark: '#581C87', primariaDark: '#A855F7' })
http.defaults.adapter = async (config) => {
  let path = config.url || ''
  if (
    scenario === 'read-retry' &&
    /\/(?:produtos|servicos|vendas|financeiro\/lancamentos)\/\d+$/.test(path) &&
    !failedReads.has(path)
  ) {
    failedReads.add(path)
    throw {
      response: {
        status: 503,
        data: {
          message: 'Falha simulada de leitura. Use Tentar novamente para recuperar os dados.',
        },
      },
    }
  }
  if (scenario === 'legacy') {
    if (path.startsWith('/modofacil/') && path !== '/modofacil/configuracao')
      throw {
        response: {
          status: 404,
          data: `<pre>Cannot ${String(config.method || 'get').toUpperCase()} /api${path}</pre>`,
        },
      }
    const aliases: Record<string, string> = {
      '/contas/parametros': '/modofacil/configuracoes/operacionais',
      '/lancamentos/contas': '/modofacil/financeiro/contas',
      '/lancamentos/categorias': '/modofacil/financeiro/categorias',
      '/lancamentos/contas/select2': '/modofacil/financeiro/contas/opcoes',
      '/lancamentos/categorias/select2': '/modofacil/financeiro/categorias/opcoes',
      '/produtos/categorias/select2': '/modofacil/produtos/categorias/opcoes',
      '/lancamentos/getDataTable': '/modofacil/financeiro/lancamentos',
      '/lancamentos/dashboard/visao-geral': '/modofacil/financeiro/resumo',
      '/clientes/getDataTable': '/modofacil/pessoas',
      '/servicos/lista/tabela': '/modofacil/servicos',
      '/servicos/lista/ordens/tabela': '/modofacil/servicos/ordens',
      '/vendas': '/modofacil/vendas',
    }
    path = aliases[path] || path
  }
  if (scenario === 'slow' && (!config.method || config.method === 'get'))
    await new Promise((resolve) => setTimeout(resolve, 1800))
  if (
    scenario === 'dashboard-loading' &&
    /(?:vendas\/resumo\/painel|financeiro\/resumo|ordens\/dashboard\/painel|modofacil\/produtos$)/.test(
      path,
    )
  )
    await new Promise((resolve) => setTimeout(resolve, 10000))
  const wrap = (data: unknown) => ({ data })
  const page = (rows: any[]) => {
    let filtered = rows.filter(
      (row) =>
        (!config.params?.search ||
          `${row.nome || row.descricao || row.Uid || ''}`
            .toLowerCase()
            .includes(String(config.params.search).toLowerCase())) &&
        (!config.params?.status ||
          String(row.status).toLowerCase() === String(config.params.status).toLowerCase()) &&
        (!config.params?.tipo || row.tipo === config.params.tipo),
    )
    if (config.params?.estoqueBaixo === 'SIM')
      filtered = filtered.filter((row) => Number(row.estoqueTotal) <= 3)
    if (config.params?.estoqueBaixo === 'NAO')
      filtered = filtered.filter((row) => Number(row.estoqueTotal) > 3)
    return {
      data: scenario === 'empty' ? [] : filtered,
      total: scenario === 'empty' ? 0 : filtered.length,
      totalPages: scenario === 'pagination' ? 12 : 1,
    }
  }
  let data: any
  if (path === '/modofacil/configuracao') data = { modo: 'FACIL', versao: 1, podeAlterar: true }
  else if (scenario === 'error')
    throw new Error('Falha simulada da prévia. Nenhuma conexão real foi enviada.')
  else if (
    scenario === 'uncertain-write' &&
    config.method &&
    !['get', 'head'].includes(config.method)
  )
    throw new Error('Conexão interrompida ao confirmar a operação fictícia.')
  else if (config.method === 'delete') {
    const match = path.match(
      /^\/modofacil\/(vendas|produtos|servicos|pessoas|financeiro\/lancamentos)\/(\d+)$/,
    )
    if (!match) throw new Error(`Prévia isolada: exclusão não simulada para ${path}`)
    const records =
      match[1] === 'vendas'
        ? demo.sales
        : match[1] === 'produtos'
          ? demo.products
          : match[1] === 'servicos'
            ? demo.services
            : match[1] === 'pessoas'
              ? demo.people
              : financeRows
    const index = records.findIndex((row) => row.id === Number(match[2]))
    if (index < 0)
      throw { response: { status: 404, data: { message: 'Registro não encontrado.' } } }
    if (
      scenario === 'delete-blocked' ||
      (match[1] === 'vendas' && (records[index] as any).faturado)
    )
      throw {
        response: {
          status: 409,
          data: { message: 'Este registro possui vínculos que impedem a exclusão.' },
        },
      }
    records.splice(index, 1)
    deletedRecords.add(path)
    data = wrap(null)
  } else if (config.method && !['get', 'head'].includes(config.method)) {
    // Local acknowledgements exercise success states without any real mutation.
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    if (path === '/modofacil/servicos') {
      const service = { ...body, id: Math.max(...demo.services.map((row) => row.id)) + 1 }
      demo.services.push(service)
      data = wrap(service)
    } else if (/\/servicos\/\d+\/(basico|status|avancado)$/.test(path)) {
      const service = demo.services.find((row) => row.id === Number(path.split('/').slice(-2)[0]))
      if (!service)
        throw { response: { status: 404, data: { message: 'Serviço fictício não encontrado.' } } }
      Object.assign(service, body)
      data = wrap(service)
    } else if (/\/produtos\/\d+\/status$/.test(path)) {
      const product = demo.products.find((row) => row.id === Number(path.split('/').slice(-2)[0]))
      if (!product) throw new Error('Produto fictício não encontrado.')
      Object.assign(product, body)
      if (product.id === demo.product.id) {
        Object.assign(demo.product, body)
        Object.assign(demo.variant, body)
      }
      data = wrap(product)
    } else if (path === '/modofacil/pessoas') {
      const id = Math.max(...demo.people.map((row) => row.id)) + 1
      const person = {
        ...demo.people[0],
        ...body,
        id,
        Uid: `CLI_QA_${id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      demo.people.push(person)
      data = wrap(person)
    } else if (/\/pessoas\/\d+\/(basico|avancado)$/.test(path)) {
      const person = demo.people.find((row) => row.id === Number(path.split('/').slice(-2)[0]))
      if (!person)
        throw { response: { status: 404, data: { message: 'Pessoa fictícia não encontrada.' } } }
      Object.assign(person, body, { updatedAt: new Date().toISOString() })
      data = wrap(person)
    } else if (/\/servicos\/ordens\/\d+\/mensagens$/.test(path)) {
      const order = demo.orders.find((row) => row.id === Number(path.split('/').slice(-2)[0]))
      if (!order) throw new Error('OS fictícia não encontrada.')
      const note = {
        id: Math.max(0, ...order.MensagensInteracoesOrdemServico.map((row) => row.id)) + 1,
        tipo: 'MENSAGEM',
        data: new Date().toISOString(),
        Autor: { nome: 'Equipe de demonstração' },
        mensagem: body.mensagem,
      }
      order.MensagensInteracoesOrdemServico.push(note)
      data = wrap(note)
    } else if (path.endsWith('/produtos/categorias')) {
      const category = { id: 194 + previewProductCategories.length, nome: body.nome }
      previewProductCategories.push(category)
      data = wrap(category)
    } else
      data = wrap(
        path.includes('/produtos')
          ? { produtoBaseId: 11, varianteId: 73, produto: demo.product }
          : { id: 80, ...body },
      )
  } else if (path.includes('/vendas/resumo/painel')) data = demo.dashboard
  else if (path.includes('/ordens/dashboard/painel')) data = demo.orderDashboard
  else if (path === '/modofacil/financeiro/resumo')
    data = wrap(financePreviewSummary(config.params))
  else if (path === '/modofacil/configuracoes/operacionais')
    data = wrap({ permitirCriacaoCobranca: true, permitirTransferenciaContaFinanceira: true })
  else if (
    [
      '/modofacil/financeiro/contas/opcoes',
      '/modofacil/financeiro/categorias/opcoes',
      '/modofacil/produtos/categorias/opcoes',
    ].includes(path)
  ) {
    const examples = path.includes('/contas/')
      ? demo.accounts
      : path.includes('/produtos/')
        ? previewProductCategories
        : demo.categories
    const catalog = [
      ...examples,
      ...Array.from({ length: 65 }, (_, index) => ({
        id: index + 100,
        nome: `Categoria de exemplo ${String(index + 1).padStart(2, '0')}`,
      })),
    ]
    const filtered = catalog.filter((item) =>
      config.params?.id != null
        ? item.id === Number(config.params.id)
        : item.id !== Number(config.params?.excludeId) &&
          item.nome.toLowerCase().includes(String(config.params?.search || '').toLowerCase()),
    )
    const offset = (Number(config.params?.page || 1) - 1) * 20
    data = {
      results: filtered
        .slice(offset, offset + 20)
        .map((item) => ({ id: item.id, label: item.nome })),
      ...(scenario === 'legacy' ? {} : { hasMore: offset + 20 < filtered.length }),
    }
  } else if (path === '/modofacil/financeiro/contas') data = wrap(demo.accounts)
  else if (path === '/modofacil/financeiro/categorias') data = wrap(demo.categories)
  else if (path === '/modofacil/financeiro/cobrancas') data = wrap(demo.charges)
  else if (path === '/modofacil/financeiro/lancamentos')
    data = financePreviewPage(config.params, scenario)
  else if (/\/financeiro\/lancamentos\/\d+$/.test(path))
    data = wrap(financeRows.find((row) => row.id === Number(path.split('/').pop())) || null)
  else if (/\/financeiro\/parcelas\/\d+$/.test(path))
    data = wrap({ ...demo.finance.parcelas[0], LancamentoFinanceiro: demo.finance })
  else if (path.includes('/relatorios/financeiro/demonstrativo'))
    data = wrap({
      resumo: { receitas: 7280, despesas: 1260, resultado: 6020 },
      grupos: { receitas: [], despesas: [] },
    })
  else if (path === '/modofacil/produtos/categorias') data = page(previewProductCategories)
  else if (path.endsWith('/variantes')) data = wrap([demo.variant])
  else if (/\/produtos\/variantes\/\d+$/.test(path)) data = wrap(demo.variant)
  else if (path === '/modofacil/produtos' || path === '/produtos')
    data = page(config.params?.listingMode === 'variante' ? [demo.variant] : demo.products)
  else if (/\/produtos\/\d+$/.test(path))
    data = wrap(demo.products.find((p) => p.id === Number(path.split('/').pop())) || demo.product)
  else if (path.includes('/pessoas/') && path.endsWith('/estatisticas'))
    data = wrap({
      financeiro: { recebido: 100, pago: 50, pendenteReceber: 420, pendentePagar: 125 },
    })
  else if (path.includes('/pessoas/') && path.endsWith('/historico')) {
    const tab = config.params?.tab
    const rows =
      tab === 'ordens'
        ? demo.orders
        : tab === 'lancamentos'
          ? financeRows.slice(0, 4)
          : tab === 'cobrancas'
            ? [
                {
                  id: 1,
                  Uid: 'COB_EXEMPLO',
                  status: 'PENDENTE',
                  valor: 420,
                  dataVencimento: demo.finance.dataLancamento,
                },
              ]
            : demo.sales
    const filtered = rows.filter(
      (row) =>
        !config.params?.search ||
        `${(row as any).Uid || ''} ${(row as any).descricao || ''}`
          .toLowerCase()
          .includes(String(config.params.search).toLowerCase()),
    )
    data = wrap({ items: filtered, meta: { total: filtered.length, totalPages: 1 } })
  } else if (/\/pessoas\/\d+$/.test(path))
    data = wrap(demo.people.find((p) => p.id === Number(path.split('/').pop())) || demo.people[0])
  else if (path === '/modofacil/pessoas') data = page(demo.people)
  else if (path === '/modofacil/vendas') data = page(demo.sales)
  else if (/\/vendas\/\d+\/edicao$/.test(path))
    data = wrap({ registro: demo.sales[0], revisao: 'preview-revision' })
  else if (/\/vendas\/\d+$/.test(path))
    data = wrap(demo.sales.find((p) => p.id === Number(path.split('/').pop())) || demo.sales[0])
  else if (path === '/modofacil/servicos/ordens') data = page(demo.orders)
  else if (/\/servicos\/ordens\/\d+\/edicao$/.test(path))
    data = wrap({ registro: demo.orders[0], revisao: 'preview-revision' })
  else if (/\/servicos\/ordens\/\d+$/.test(path))
    data = wrap(demo.orders.find((p) => p.id === Number(path.split('/').pop())) || demo.orders[0])
  else if (path === '/modofacil/servicos') data = page(demo.services)
  else if (/\/servicos\/\d+$/.test(path))
    data = wrap(demo.services.find((row) => row.id === Number(path.split('/').pop())))
  else if (path.endsWith('/caixa/contexto'))
    data = wrap({
      caixaAtivo: ['cash-closed', 'cash-available'].includes(scenario || '') ? null : cashSession,
      caixasAbertos: scenario === 'cash-available' ? [cashSession] : [],
      pdvs: [cashSession.pdv],
    })
  else if (path.endsWith('/caixa/resumo')) data = wrap(cashSummary)
  else if (path.includes('/estoque/movimentacoes')) data = page(demo.movements)
  else throw new Error(`Prévia isolada: fixture ausente para ${path}`)
  if (deletedRecords.has(path) && (!config.method || config.method === 'get')) data = wrap(null)
  return { data: structuredClone(data), status: 200, statusText: 'OK', headers: {}, config }
}
const pinia = createPinia()
const router = createRouter({ history: createMemoryHistory(), routes: modoFacilRoutes })
// Delay only simulated navigation so QA can inspect the centered loader.
if (scenario === 'slow-navigation')
  router.beforeEach(async (to, from) => {
    if (from.matched.length && to.path !== from.path)
      await new Promise((resolve) => setTimeout(resolve, 6000))
  })
const previewWorkspace = createModalWorkspace(() => true)
function previewForm(path: string): { target: FormTarget; background: string } | null {
  const url = new URL(path, location.origin)
  const definitions = Object.entries(forms).sort(
    (a, b) =>
      (a[1].legacyPath.match(/:/g)?.length || 0) - (b[1].legacyPath.match(/:/g)?.length || 0),
  )
  for (const [name, definition] of definitions) {
    const keys: string[] = []
    const pattern = ('/modofacil/' + definition.legacyPath).replace(
      /\/:([^/?]+)(\?)?/g,
      (_match, key: string, optional: string) => {
        keys.push(key)
        return optional ? '(?:/([^/]+))?' : '/([^/]+)'
      },
    )
    const match = url.pathname.match(new RegExp('^' + pattern + '$'))
    if (name === 'estoque' && !['reposicao', 'descarte', undefined].includes(match?.[1])) continue
    if (match)
      return {
        background: definition.background,
        target: {
          form: name as FormName,
          params: Object.fromEntries(
            keys.flatMap((key, i) => (match[i + 1] ? [[key, match[i + 1]!]] : [])),
          ),
          query: Object.fromEntries(url.searchParams),
        },
      }
  }
  return null
}
async function showPreview(path: string) {
  const form = previewForm(path)
  if (!form) {
    await router.push(path)
    return
  }
  if (!(await previewWorkspace.canLeave(true))) return
  previewWorkspace.reset()
  if (router.currentRoute.value.path !== form.background) await router.push(form.background)
  previewWorkspace.open(form.target, router.currentRoute.value.fullPath)
}
const app = createApp({
  render: () =>
    h('div', {}, [
      h(
        'div',
        {
          class:
            'flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 font-sans text-xs text-amber-800',
        },
        [
          h('span', 'DEMONSTRAÇÃO LOCAL · Dados fictícios · Nenhuma operação real é enviada.'),
          h(
            'span',
            {
              'data-testid': 'workspace-location',
              class: 'max-w-[40vw] truncate',
              title: router.currentRoute.value.fullPath,
            },
            'Tela: ' + router.currentRoute.value.fullPath,
          ),
          h('label', { class: 'flex min-w-0 items-center gap-2' }, [
            'Tela de demonstração',
            h(
              'select',
              {
                'aria-label': 'Tela de demonstração',
                class: 'max-w-48 rounded border border-amber-200 bg-white px-2 py-1 text-xs',
                value:
                  demo.previewCases.find(
                    ([, path]) =>
                      path === router.currentRoute.value.fullPath ||
                      path.split('?')[0] === router.currentRoute.value.path,
                  )?.[1] || '/modofacil',
                onChange: (event: Event) => showPreview((event.target as HTMLSelectElement).value),
              },
              demo.previewCases.map(([label, path]) => h('option', { value: path }, label)),
            ),
          ]),
        ],
      ),
      h(RouterView),
    ]),
})
app.provide(modalWorkspaceKey, previewWorkspace)
app.use(pinia)
app.use(Toast, { transition: 'Vue-Toastification__fade', container: createToastContainer })
const ui = useUiStore()
ui.usuarioLogged = { id: 1, nome: 'João Silva', permissao: 'admin', superAdmin: false } as any
ui.contaInfo = {
  id: 1,
  nome: 'Loja Exemplo — QA',
  nomeFantasia: 'Loja Exemplo',
  email: 'contato@exemplo.test',
  telefone: '(00) 00000-0000',
} as any
experience.configuration = { modo: 'FACIL', versao: 1, podeAlterar: true }
const initialPath = new URLSearchParams(location.search).get('page') || '/modofacil'
const initialForm = previewForm(initialPath)
await router.push(initialForm?.background || initialPath)
if (initialForm) previewWorkspace.open(initialForm.target, router.currentRoute.value.fullPath)
app.use(router)
await router.isReady()
app.mount('#app')
