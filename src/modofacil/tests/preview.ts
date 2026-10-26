// Isolated harness: all HTTP responses are in memory; sockets use previewSocket.
import { createApp, h } from 'vue'
import '@/assets/style.css'
import { setThemeCustomization } from '@/utils/theme'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import Toast from 'vue-toastification'
import http from '@/utils/axios'
import { useUiStore } from '@/stores/ui/uiStore'
import { experience } from '../application/experience'
import { modoFacilRoutes } from '../routes'
import * as demo from './previewFixtures'
import { forms, type FormName, type FormTarget } from '../application/formDialogs'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
const scenario = new URLSearchParams(location.search).get('scenario')
const palette = new URLSearchParams(location.search).get('palette')
if (palette === 'warm')
  setThemeCustomization({ fundoDark: '#291A11', sidebarDark: '#713F12', primariaDark: '#EA580C' })
if (palette === 'violet')
  setThemeCustomization({ fundoDark: '#2E1065', sidebarDark: '#581C87', primariaDark: '#A855F7' })
http.defaults.adapter = async (config) => {
  let path = config.url || ''
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
  const wrap = (data: unknown) => ({ data })
  const page = (rows: any[]) => {
    let filtered = rows.filter(
      (row) =>
        (!config.params?.search ||
          `${row.nome || row.descricao || row.Uid || ''}`
            .toLowerCase()
            .includes(String(config.params.search).toLowerCase())) &&
        (!config.params?.status || row.status === config.params.status),
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
  else if (config.method && !['get', 'head'].includes(config.method)) {
    // Local acknowledgements exercise success states without any real mutation.
    data = wrap(
      path.includes('/produtos')
        ? { produtoBaseId: 11, varianteId: 73, produto: demo.product }
        : { id: 80, ...(typeof config.data === 'string' ? JSON.parse(config.data) : config.data) },
    )
  } else if (path.includes('/vendas/resumo/painel')) data = demo.dashboard
  else if (path.includes('/ordens/dashboard/painel')) data = demo.orderDashboard
  else if (path === '/modofacil/financeiro/resumo') data = wrap(demo.financeSummary)
  else if (path === '/modofacil/configuracoes/operacionais')
    data = wrap({ permitirCriacaoCobranca: true, permitirTransferenciaContaFinanceira: true })
  else if (path === '/modofacil/financeiro/contas') data = wrap(demo.accounts)
  else if (path === '/modofacil/financeiro/categorias') data = wrap(demo.categories)
  else if (path === '/modofacil/financeiro/cobrancas') data = wrap(demo.charges)
  else if (path === '/modofacil/financeiro/lancamentos') data = page([demo.finance])
  else if (/\/financeiro\/lancamentos\/\d+$/.test(path)) data = wrap(demo.finance)
  else if (/\/financeiro\/parcelas\/\d+$/.test(path))
    data = wrap({ ...demo.finance.parcelas[0], LancamentoFinanceiro: demo.finance })
  else if (path.includes('/relatorios/financeiro/demonstrativo'))
    data = wrap({
      resumo: { receitas: 7280, despesas: 1260, resultado: 6020 },
      grupos: { receitas: [], despesas: [] },
    })
  else if (path === '/modofacil/produtos/categorias') data = page([{ id: 2, nome: 'Mercearia' }])
  else if (path.endsWith('/variantes')) data = wrap([demo.variant])
  else if (/\/produtos\/variantes\/\d+$/.test(path)) data = wrap(demo.variant)
  else if (path === '/modofacil/produtos' || path === '/produtos')
    data = page(config.params?.listingMode === 'variante' ? [demo.variant] : demo.products)
  else if (/\/produtos\/\d+$/.test(path))
    data = wrap(demo.products.find((p) => p.id === Number(path.split('/').pop())) || demo.product)
  else if (path.includes('/pessoas/') && path.endsWith('/historico'))
    data = wrap({ items: demo.sales, meta: { total: demo.sales.length, totalPages: 1 } })
  else if (/\/pessoas\/\d+$/.test(path))
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
  else if (/\/servicos\/\d+$/.test(path)) data = wrap(demo.services[0])
  else if (path.endsWith('/caixa/contexto'))
    data = wrap({
      caixaAtivo: { id: 1, codigo: 'Caixa de demonstração', saldoEsperado: 150 },
      caixasAbertos: [],
      pdvs: [],
    })
  else if (path.endsWith('/caixa/resumo'))
    data = wrap({
      resumo: { totalVendido: 420 },
      movimentos: [{ id: 1, tipo: 'REFORCO', valor: 150, descricao: 'Saldo de demonstração' }],
    })
  else if (path.includes('/estoque/movimentacoes')) data = page(demo.movements)
  else throw new Error(`Prévia isolada: fixture ausente para ${path}`)
  return { data: structuredClone(data), status: 200, statusText: 'OK', headers: {}, config }
}
const pinia = createPinia()
const router = createRouter({ history: createMemoryHistory(), routes: modoFacilRoutes })
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
            { 'data-testid': 'workspace-location' },
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
app.use(Toast)
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
