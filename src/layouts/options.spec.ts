import { describe, expect, it } from 'vitest'

import {
  ALL_SUBMENU_VISIBILITY_KEYS,
  filterSidebarMenuByVisibility,
  getMainMenuVisibilityOptions,
  MAIN_MENU_VISIBILITY_OPTIONS,
  MENU_SUBMENU_VISIBILITY_OPTIONS,
  sidebarMenuOptions,
} from './options'
import type { Permissoes } from '@/stores/ui/uiStore'
import type { SidebarMenuType } from '@/types/sidebar'

function permissoes(nivel: number): Permissoes {
  const modulo = {
    editar: nivel >= 2,
    visualizar: nivel >= 1,
    criar: nivel >= 2,
    excluir: nivel >= 3,
    painel: nivel >= 3,
  }
  return new Proxy({} as Permissoes, { get: () => modulo })
}

describe('MAIN_MENU_VISIBILITY_OPTIONS', () => {
  // A tela de configurações renderiza esta lista: estar aqui é o que permite ocultar/mostrar
  // o menu. A Loja Virtual ficava de fora e por isso não aparecia lá.
  it('permite configurar a visibilidade da Loja Virtual', () => {
    expect(MAIN_MENU_VISIBILITY_OPTIONS.map((m) => m.key)).toContain('loja-virtual')
  })

  // 'loja' é a App Store (complementos) e 'loja-virtual' é a vitrine: menus diferentes, que
  // não podem colidir nem ser confundidos.
  it('mantém App Store e Loja Virtual como entradas distintas', () => {
    const keys = MAIN_MENU_VISIBILITY_OPTIONS.map((m) => m.key)
    expect(keys).toContain('loja')
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('mostra configuracao apenas dos menus de apps ativos na conta', () => {
    const semApps = getMainMenuVisibilityOptions({}).map((m) => m.key)
    expect(semApps).toContain('vendas')
    expect(semApps).toContain('loja')
    expect(semApps).not.toContain('assinaturas')
    expect(semApps).not.toContain('atendimento')
    expect(semApps).not.toContain('loja-virtual')
    expect(semApps).not.toContain('core-ia')
    expect(semApps).not.toContain('whatsapp')

    const comApps = getMainMenuVisibilityOptions({
      assinaturas: true,
      atendimento: true,
      'loja-virtual': true,
      'core-ia': true,
      whatsapp: true,
    }).map((m) => m.key)
    expect(comApps).toContain('assinaturas')
    expect(comApps).toContain('atendimento')
    expect(comApps).toContain('loja-virtual')
    expect(comApps).toContain('core-ia')
    expect(comApps).toContain('whatsapp')
  })
})

describe('PDV no submenu de Vendas', () => {
  const submenusVendas = (nivel: number) =>
    sidebarMenuOptions(permissoes(nivel)).find((item) => item.key === 'vendas')?.children ?? []

  it('fica logo acima de Caixas dentro do dropdown de Vendas', () => {
    const chaves = submenusVendas(4).map((child) => child.key)

    expect(chaves).toEqual(['vendas:painel', 'vendas:lista', 'vendas:pdv', 'vendas:caixas'])
    expect(submenusVendas(4).find((child) => child.key === 'vendas:pdv')?.link).toBe('/vendas/pdv')
  })

  // A rota /vendas/pdv exige `permissao: 2`. Mostrar o item para o nível 1 daria um
  // link que o roteador barra na entrada.
  it('nao aparece para quem o roteador barraria na rota do PDV', () => {
    expect(submenusVendas(1).find((child) => child.key === 'vendas:pdv')?.show).toBe(false)
    expect(submenusVendas(2).find((child) => child.key === 'vendas:pdv')?.show).toBe(true)
  })

  it('pode ser ocultado individualmente pela tela de configuracoes', () => {
    expect(MENU_SUBMENU_VISIBILITY_OPTIONS.vendas.map((s) => s.key)).toContain('vendas:pdv')
    expect(ALL_SUBMENU_VISIBILITY_KEYS).toContain('vendas:pdv')
  })

  // Submenu é blacklist: key ausente = visível. Contas que já personalizaram o menu
  // recebem o PDV sem precisar reconfigurar nada.
  it('aparece para contas que ja personalizaram o menu', () => {
    const menu: SidebarMenuType[] = [
      {
        key: 'vendas',
        nome: 'Vendas',
        show: true,
        children: [
          { key: 'vendas:lista', nome: 'Vendas', link: '/vendas' },
          { key: 'vendas:pdv', nome: 'PDV', link: '/vendas/pdv' },
        ],
      },
    ]
    const [vendas] = filterSidebarMenuByVisibility(menu, ['vendas'], false, ['vendas:painel'])

    expect(vendas.children?.map((child) => child.nome)).toContain('PDV')
  })
})

describe('filterSidebarMenuByVisibility', () => {
  const menu: SidebarMenuType[] = [
    { key: 'dashboard', nome: 'Dashboard', link: '/' },
    { key: 'vendas', nome: 'Vendas', show: true, children: [{ nome: 'Vendas', link: '/vendas' }] },
    { nome: 'Apps', divisor: true, show: true },
    { key: 'whatsapp', nome: 'WhatsApp', show: true, link: '/whatsapp' },
    { nome: 'Administração', divisor: true, show: true },
    { key: 'configuracoes', nome: 'Configurações', show: true, link: '/configuracoes' },
    { key: 'loja', nome: 'App Store', show: true, link: '/loja' },
  ]

  it('keeps current menu behavior when no visibility setting was saved', () => {
    expect(filterSidebarMenuByVisibility(menu, null, false).map((item) => item.nome)).toEqual([
      'Dashboard',
      'Vendas',
      'Apps',
      'WhatsApp',
      'Administração',
      'Configurações',
      'App Store',
    ])
  })

  it('hides unchecked top-level menu cards and removes empty dividers', () => {
    expect(filterSidebarMenuByVisibility(menu, ['dashboard', 'configuracoes'], false).map((item) => item.nome)).toEqual([
      'Dashboard',
      'Configurações',
    ])
  })

  it('keeps settings visible for root users so they can recover hidden menus', () => {
    expect(filterSidebarMenuByVisibility(menu, ['dashboard'], true).map((item) => item.nome)).toEqual([
      'Dashboard',
      'Configurações',
    ])
  })

  const menuComSubmenus: SidebarMenuType[] = [
    {
      key: 'vendas',
      nome: 'Vendas',
      show: true,
      children: [
        { key: 'vendas:painel', nome: 'Painel', link: '/vendas/dashboard' },
        { key: 'vendas:lista', nome: 'Vendas', link: '/vendas' },
        { key: 'vendas:caixas', nome: 'Caixas', link: '/vendas/caixas' },
      ],
    },
  ]

  it('keeps all submenus when no submenu is hidden', () => {
    const [vendas] = filterSidebarMenuByVisibility(menuComSubmenus, null, false, [])
    expect(vendas.children?.map((child) => child.nome)).toEqual(['Painel', 'Vendas', 'Caixas'])
  })

  it('removes submenus whose key is in the hidden list', () => {
    const [vendas] = filterSidebarMenuByVisibility(menuComSubmenus, null, false, ['vendas:caixas'])
    expect(vendas.children?.map((child) => child.nome)).toEqual(['Painel', 'Vendas'])
  })

  it('filters submenus even when top-level visibility is also applied', () => {
    const [vendas] = filterSidebarMenuByVisibility(menuComSubmenus, ['vendas'], false, ['vendas:painel'])
    expect(vendas.children?.map((child) => child.nome)).toEqual(['Vendas', 'Caixas'])
  })
})
