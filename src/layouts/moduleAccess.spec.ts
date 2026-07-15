import { describe, expect, it } from 'vitest'
import { isModuleActive, type ModuleAccessContext } from './moduleAccess'
import type { Permissoes } from '@/stores/ui/uiStore'

const permissaoCheia = { editar: true, visualizar: true, criar: true, excluir: true, painel: true }
const permissaoVazia = { editar: false, visualizar: false, criar: false, excluir: false, painel: false }

function permissoes(overrides: Partial<Permissoes> = {}): Permissoes {
  return {
    superadmin: false,
    admin: true,
    produtos: { ...permissaoCheia },
    clientes: { ...permissaoCheia },
    servicos: { ...permissaoCheia },
    vendas: { ...permissaoCheia },
    financeiro: { ...permissaoCheia },
    relatorios: { ...permissaoCheia },
    configuracoes: { ...permissaoCheia },
    usuarios: { ...permissaoCheia },
    ...overrides,
  } as Permissoes
}

function ctx(overrides: Partial<ModuleAccessContext> = {}): ModuleAccessContext {
  return {
    permissoes: permissoes(),
    appModules: { assinaturas: true, atendimento: true, 'loja-virtual': true },
    visibleMenuKeys: null,
    hiddenSubmenuKeys: [],
    ...overrides,
  }
}

describe('isModuleActive', () => {
  // Contas antigas não têm configuração de visibilidade: nada deve sumir por causa disso.
  it('trata visibleMenuKeys nulo como tudo visível', () => {
    for (const key of ['vendas', 'financeiro', 'produtos', 'servicos', 'clientes'] as const) {
      expect(isModuleActive(key, ctx({ visibleMenuKeys: null })), key).toBe(true)
    }
  })

  it('esconde módulo fora da whitelist de menus', () => {
    const c = ctx({ visibleMenuKeys: ['vendas', 'financeiro'] })
    expect(isModuleActive('vendas', c)).toBe(true)
    expect(isModuleActive('produtos', c)).toBe(false)
    expect(isModuleActive('servicos', c)).toBe(false)
  })

  it('esconde módulo sem permissão de visualizar, mesmo estando na whitelist', () => {
    const c = ctx({
      visibleMenuKeys: ['produtos'],
      permissoes: permissoes({ produtos: { ...permissaoVazia } }),
    })
    expect(isModuleActive('produtos', c)).toBe(false)
  })

  // Apps adicionais: o módulo só existe se a conta contratou.
  it('exige o app contratado para assinaturas, atendimento e loja', () => {
    const semApps = ctx({ appModules: {} })
    expect(isModuleActive('assinaturas', semApps)).toBe(false)
    expect(isModuleActive('atendimento', semApps)).toBe(false)
    expect(isModuleActive('loja-virtual', semApps)).toBe(false)

    const comApps = ctx()
    expect(isModuleActive('assinaturas', comApps)).toBe(true)
    expect(isModuleActive('atendimento', comApps)).toBe(true)
    expect(isModuleActive('loja-virtual', comApps)).toBe(true)
  })

  // A Loja Virtual passou a ser configurável como os demais menus. Contas antigas recebem a
  // key por migration de backfill; sem ela, a whitelist esconderia a loja de quem já usava.
  it('respeita a whitelist para a loja virtual', () => {
    expect(isModuleActive('loja-virtual', ctx({ visibleMenuKeys: ['vendas'] }))).toBe(false)
    expect(isModuleActive('loja-virtual', ctx({ visibleMenuKeys: ['loja-virtual'] }))).toBe(true)
  })

  it('esconde a loja virtual sem permissão de produtos', () => {
    const c = ctx({ permissoes: permissoes({ produtos: { ...permissaoVazia } }) })
    expect(isModuleActive('loja-virtual', c)).toBe(false)
  })

  // Caixas é submenu de vendas: some se o pai sumir OU se o submenu for ocultado.
  it('trata caixas como submenu de vendas', () => {
    expect(isModuleActive('caixas', ctx())).toBe(true)
    expect(isModuleActive('caixas', ctx({ hiddenSubmenuKeys: ['vendas:caixas'] }))).toBe(false)
    expect(isModuleActive('caixas', ctx({ visibleMenuKeys: ['financeiro'] }))).toBe(false)
  })

  it('libera metas apenas para admin', () => {
    expect(isModuleActive('metas', ctx())).toBe(true)
    expect(isModuleActive('metas', ctx({ permissoes: permissoes({ admin: false }) }))).toBe(false)
  })

  it('usa a permissão de vendas para comandas', () => {
    expect(isModuleActive('comandas', ctx())).toBe(true)
    expect(
      isModuleActive('comandas', ctx({ permissoes: permissoes({ vendas: { ...permissaoVazia } }) })),
    ).toBe(false)
  })
})
