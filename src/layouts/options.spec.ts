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
})
