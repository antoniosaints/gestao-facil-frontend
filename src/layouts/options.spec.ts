import { describe, expect, it } from 'vitest'

import { filterSidebarMenuByVisibility, getMainMenuVisibilityOptions, MAIN_MENU_VISIBILITY_OPTIONS } from './options'
import type { SidebarMenuType } from '@/types/sidebar'

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
