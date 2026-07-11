import { describe, expect, it } from 'vitest'

import { filterSidebarMenuByVisibility } from './options'
import type { SidebarMenuType } from '@/types/sidebar'

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
