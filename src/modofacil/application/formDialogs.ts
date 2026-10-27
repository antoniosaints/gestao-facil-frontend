import type { Component } from 'vue'

interface FormDefinition {
  title: string
  background: string
  level: number
  component: () => Promise<{ default: Component }>
  legacyPath: string
  meta?: Record<string, string>
}
const defineForm = (
  title: string,
  background: string,
  level: number,
  legacyPath: string,
  component: FormDefinition['component'],
  meta?: Record<string, string>,
): FormDefinition => ({ title, background, level, legacyPath, component, meta })

// Form identifiers and payloads are local UI state. Paths below only redirect
// old bookmarks to a real page; they never open or control a modal.
export const forms = {
  'produto-novo': defineForm(
    'Novo produto',
    '/modofacil/produtos',
    4,
    'produtos/novo',
    () => import('../pages/ProductFormPage.vue'),
  ),
  'produto-editar': defineForm(
    'Editar produto',
    '/modofacil/produtos',
    4,
    'produtos/:produtoBaseId/editar',
    () => import('../pages/ProductFormPage.vue'),
  ),
  variante: defineForm(
    'Editar variante',
    '/modofacil/produtos',
    4,
    'produtos/:produtoBaseId/variantes/:varianteId',
    () => import('../pages/ProductFormPage.vue'),
  ),
  'variante-nova': defineForm(
    'Nova variante',
    '/modofacil/produtos',
    4,
    'produtos/:produtoBaseId/variantes/novo',
    () => import('../pages/VariantCreatePage.vue'),
  ),
  'produto-avancado': defineForm(
    'Informações do produto',
    '/modofacil/produtos',
    4,
    'produtos/:produtoBaseId/avancado',
    () => import('../pages/AdvancedFieldsPage.vue'),
    { entity: 'base' },
  ),
  'variante-avancado': defineForm(
    'Informações da variante',
    '/modofacil/produtos',
    4,
    'produtos/:produtoBaseId/variantes/:varianteId/avancado',
    () => import('../pages/AdvancedFieldsPage.vue'),
    { entity: 'variante' },
  ),
  'pessoa-nova': defineForm(
    'Nova pessoa',
    '/modofacil/pessoas',
    2,
    'pessoas/nova',
    () => import('../pages/PersonFormPage.vue'),
  ),
  'pessoa-editar': defineForm(
    'Editar pessoa',
    '/modofacil/pessoas',
    2,
    'pessoas/:id/editar',
    () => import('../pages/PersonContactFormPage.vue'),
  ),
  'pessoa-avancado': defineForm(
    'Informações da pessoa',
    '/modofacil/pessoas',
    2,
    'pessoas/:id/avancado',
    () => import('../pages/AdvancedFieldsPage.vue'),
    { entity: 'pessoa' },
  ),
  'venda-nova': defineForm(
    'Nova venda ou orçamento',
    '/modofacil/vendas',
    2,
    'vendas/nova',
    () => import('../pages/SaleFormPage.vue'),
  ),
  'venda-editar': defineForm(
    'Editar venda',
    '/modofacil/vendas',
    2,
    'vendas/:id/editar',
    () => import('../pages/OperationEditPage.vue'),
    { operation: 'venda' },
  ),
  'lancamento-novo': defineForm(
    'Novo lançamento',
    '/modofacil/financeiro',
    3,
    'financeiro/novo',
    () => import('../pages/FinanceFormPage.vue'),
  ),
  'lancamento-editar': defineForm(
    'Editar lançamento',
    '/modofacil/financeiro',
    3,
    'financeiro/lancamentos/:id/editar',
    () => import('../pages/FinanceEditPage.vue'),
  ),
  'financeiro-transferir': defineForm(
    'Transferir entre contas',
    '/modofacil/financeiro',
    3,
    'financeiro/transferir',
    () => import('../pages/TransferPage.vue'),
  ),
  'financeiro-cobranca-nova': defineForm(
    'Nova cobrança',
    '/modofacil/financeiro/cobrancas',
    3,
    'financeiro/cobrancas/nova',
    () => import('../pages/ChargeFormPage.vue'),
  ),
  'financeiro-parcela': defineForm(
    'Editar parcela',
    '/modofacil/financeiro',
    3,
    'financeiro/lancamentos/:id/parcelas/:parcelaId?',
    () => import('../pages/ParcelFormPage.vue'),
  ),
  'financeiro-recorrencia': defineForm(
    'Editar recorrência',
    '/modofacil/financeiro',
    3,
    'financeiro/lancamentos/:id/recorrencia',
    () => import('../pages/RecurrencePage.vue'),
  ),
  'servico-novo': defineForm(
    'Novo serviço',
    '/modofacil/servicos',
    2,
    'servicos/novo',
    () => import('../pages/ServiceFormPage.vue'),
  ),
  'servico-editar': defineForm(
    'Editar serviço',
    '/modofacil/servicos',
    2,
    'servicos/:id/editar',
    () => import('../pages/ServiceFormPage.vue'),
  ),
  'servico-avancado': defineForm(
    'Informações fiscais do serviço',
    '/modofacil/servicos',
    4,
    'servicos/:id/avancado',
    () => import('../pages/AdvancedFieldsPage.vue'),
    { entity: 'servico' },
  ),
  'ordem-nova': defineForm(
    'Nova ordem de serviço',
    '/modofacil/servicos/ordens',
    2,
    'servicos/ordens/nova',
    () => import('../pages/OrderFormPage.vue'),
  ),
  'ordem-editar': defineForm(
    'Editar ordem de serviço',
    '/modofacil/servicos/ordens',
    2,
    'servicos/ordens/:id/editar',
    () => import('../pages/OperationEditPage.vue'),
    { operation: 'os' },
  ),
  estoque: defineForm(
    'Movimentar estoque',
    '/modofacil/estoque/movimentacoes',
    4,
    'estoque/:operacao?',
    () => import('../pages/StockPage.vue'),
  ),
  'estoque-lote': defineForm(
    'Reposição em lote',
    '/modofacil/estoque/movimentacoes',
    4,
    'estoque/reposicao/lote',
    () => import('../pages/StockBatchPage.vue'),
  ),
}
export type FormName = keyof typeof forms
export interface FormTarget {
  form: FormName
  params?: Record<string, string | number>
  query?: Record<string, string | number | undefined>
}
