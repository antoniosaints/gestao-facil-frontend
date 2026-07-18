import { ref } from 'vue'

// Fonte única da lógica de instalação do PWA. Captura o evento `beforeinstallprompt`
// uma vez (nível de módulo) e compartilha o estado entre o botão do sidebar e o
// diálogo de instalação, evitando listeners duplicados e prompt consumido em dobro.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const canInstall = ref(false)
const installed = ref(false)
let initialized = false

function detectInstalled() {
  if (typeof window === 'undefined') return
  const standalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  installed.value = Boolean(standalone)
}

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  detectInstalled()

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Impede o mini-infobar padrão do navegador; controlamos a instalação nós mesmos.
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    installed.value = true
    canInstall.value = false
    deferredPrompt.value = null
  })

  // Reavalia caso o app passe a rodar em modo standalone (instalado/aberto como app).
  window
    .matchMedia?.('(display-mode: standalone)')
    ?.addEventListener?.('change', detectInstalled)
}

export function usePwaInstall() {
  init()

  async function promptInstall() {
    const prompt = deferredPrompt.value
    if (!prompt) return
    prompt.prompt()
    try {
      await prompt.userChoice
    } finally {
      // O evento só pode ser usado uma vez.
      deferredPrompt.value = null
      canInstall.value = false
    }
  }

  return { canInstall, installed, promptInstall }
}
