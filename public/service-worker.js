self.addEventListener('install', (event) => {
  console.log('[SW] Instalado')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado')
  return self.clients.claim()
})

self.addEventListener('push', function (event) {
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { title: 'Notificação', body: event.data.text() }
    }
  }

  const title = data.title || 'Nova Notificação'

  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: '/imgs/logo.png',
    badge: '/imgs/logo.png',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === target && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(target)
    }),
  )
})
