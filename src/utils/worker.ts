if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => console.log('[SW] Registrado'))
      .catch((err) => console.error('[SW] Erro ao registrar:', err))
  })
}
