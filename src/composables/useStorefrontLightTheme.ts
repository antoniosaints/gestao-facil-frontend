import { onBeforeUnmount, onMounted } from 'vue'

const LIGHT_VARIABLES: Record<string, string> = {
  '--background': '210 20% 98%',
  '--body': '220 13% 91%',
  '--foreground': '222.2 84% 4.9%',
  '--card': '210 20% 98%',
  '--card-foreground': '222.2 84% 4.9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '222.2 84% 4.9%',
  '--secondary': '216 12.2% 83.9%',
  '--secondary-foreground': '222.2 47.4% 11.2%',
  '--muted': '216 12.2% 83.9%',
  '--muted-foreground': '215.4 16.3% 46.9%',
  '--accent': '210 40% 96.1%',
  '--accent-foreground': '222.2 47.4% 11.2%',
  '--border': '212.7 26.8% 83.9%',
  '--input': '212.7 26.8% 83.9%',
}

type ThemeSnapshot = {
  hadDark: boolean
  hadLight: boolean
  colorScheme: string
  variables: Map<string, { value: string; priority: string }>
}

let activeConsumers = 0
let observer: MutationObserver | null = null
let snapshot: ThemeSnapshot | null = null

function enforceLightTheme() {
  const root = document.documentElement
  if (root.classList.contains('dark')) root.classList.remove('dark')
  if (!root.classList.contains('light')) root.classList.add('light')
  if (root.style.colorScheme !== 'light') root.style.colorScheme = 'light'
  for (const [property, value] of Object.entries(LIGHT_VARIABLES)) {
    if (root.style.getPropertyValue(property).trim() !== value) root.style.setProperty(property, value)
  }
}

/** Mantém as rotas públicas da loja em modo claro sem alterar a preferência do sistema. */
export function useStorefrontLightTheme() {
  onMounted(() => {
    const root = document.documentElement
    if (activeConsumers === 0) {
      const variables = new Map<string, { value: string; priority: string }>()
      for (const property of Object.keys(LIGHT_VARIABLES)) {
        variables.set(property, {
          value: root.style.getPropertyValue(property),
          priority: root.style.getPropertyPriority(property),
        })
      }
      snapshot = {
        hadDark: root.classList.contains('dark'),
        hadLight: root.classList.contains('light'),
        colorScheme: root.style.colorScheme,
        variables,
      }
      observer = new MutationObserver(enforceLightTheme)
      observer.observe(root, { attributes: true, attributeFilter: ['class', 'style'] })
    }
    activeConsumers += 1
    enforceLightTheme()
  })

  onBeforeUnmount(() => {
    activeConsumers = Math.max(0, activeConsumers - 1)
    if (activeConsumers > 0 || !snapshot) return
    observer?.disconnect()
    const root = document.documentElement
    root.classList.toggle('dark', snapshot.hadDark)
    root.classList.toggle('light', snapshot.hadLight)
    root.style.colorScheme = snapshot.colorScheme
    for (const [property, previous] of snapshot.variables) {
      if (previous.value) root.style.setProperty(property, previous.value, previous.priority)
      else root.style.removeProperty(property)
    }
    observer = null
    snapshot = null
  })
}
