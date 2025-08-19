export type SidebarMenuType = {
  nome: string
  icone?: string
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
