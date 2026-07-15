import type { Permissoes } from '@/stores/ui/uiStore'

/**
 * Quais módulos a conta realmente enxerga.
 *
 * A resposta depende de três coisas que hoje viviam espalhadas:
 *  - `permissoes`: o que o usuário pode ver;
 *  - `appModules`: apps adicionais contratados (assinaturas, atendimento, loja-virtual);
 *  - `visibleMenuKeys` / `hiddenSubmenuKeys`: a visibilidade configurada na conta, onde as
 *    keys de topo são whitelist e as de submenu são blacklist.
 *
 * As regras espelham `sidebarMenuOptions` em `options.ts` de propósito: se um módulo não
 * aparece no menu, também não deve aparecer na dashboard. Ao mexer lá, mexa aqui.
 */

export type ModuleKey =
  | 'vendas'
  | 'caixas'
  | 'comandas'
  | 'financeiro'
  | 'produtos'
  | 'servicos'
  | 'clientes'
  | 'metas'
  | 'assinaturas'
  | 'atendimento'
  | 'loja-virtual'

export type ModuleAccessContext = {
  permissoes: Permissoes
  appModules: Record<string, boolean>
  // `null` significa "conta sem configuração de visibilidade" => tudo visível.
  visibleMenuKeys: string[] | null | undefined
  hiddenSubmenuKeys?: string[] | null
}

function menuVisivel(ctx: ModuleAccessContext, key: string) {
  if (!Array.isArray(ctx.visibleMenuKeys)) return true
  return ctx.visibleMenuKeys.includes(key)
}

function submenuVisivel(ctx: ModuleAccessContext, key: string) {
  return !(ctx.hiddenSubmenuKeys ?? []).includes(key)
}

function app(ctx: ModuleAccessContext, codigo: string) {
  return Boolean(ctx.appModules?.[codigo])
}

export function isModuleActive(key: ModuleKey, ctx: ModuleAccessContext): boolean {
  const p = ctx.permissoes
  switch (key) {
    case 'vendas':
      return p.vendas.visualizar && menuVisivel(ctx, 'vendas')
    // Caixas é submenu de vendas: depende do módulo pai e da blacklist de submenus.
    case 'caixas':
      return p.vendas.visualizar && menuVisivel(ctx, 'vendas') && submenuVisivel(ctx, 'vendas:caixas')
    case 'comandas':
      return p.vendas.visualizar && menuVisivel(ctx, 'comandas')
    case 'financeiro':
      return p.financeiro.visualizar && menuVisivel(ctx, 'financeiro')
    case 'produtos':
      return p.produtos.visualizar && menuVisivel(ctx, 'produtos')
    case 'servicos':
      return p.servicos.visualizar && menuVisivel(ctx, 'servicos')
    case 'clientes':
      return p.clientes.visualizar && menuVisivel(ctx, 'clientes')
    // Metas ficam restritas a administradores: vendedores não devem ver alvos da equipe.
    case 'metas':
      return p.admin && menuVisivel(ctx, 'metas')
    case 'assinaturas':
      return p.financeiro.visualizar && app(ctx, 'assinaturas') && menuVisivel(ctx, 'assinaturas')
    case 'atendimento':
      return p.configuracoes.visualizar && app(ctx, 'atendimento') && menuVisivel(ctx, 'atendimento')
    case 'loja-virtual':
      return p.produtos.visualizar && app(ctx, 'loja-virtual') && menuVisivel(ctx, 'loja-virtual')
    default:
      return false
  }
}
