import type { Component } from 'vue'

export type SidebarMenuType = {
  key?: string
  nome: string
  icone?: string | Component
  show?: boolean
  color?:
    | 'blue'
    | 'red'
    | 'yellow'
    | 'green'
    | 'gray'
    | 'indigo'
    | 'purple'
    | 'pink'
    | 'orange'
    | 'emerald'
    | 'cyan'
    | 'slate'
    | 'violet'
  link?: string
  divisor?: boolean
  children?: Omit<SidebarMenuType, 'children'>[]
}
