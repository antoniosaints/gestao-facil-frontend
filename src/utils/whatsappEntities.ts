// Extração das entidades estruturadas (localização e contato) de uma mensagem do WhatsApp.
// Tanto as mensagens recebidas (webhook da W-API) quanto as enviadas por nós guardam no
// `rawPayload` um envelope `{ msgContent: { locationMessage | contactMessage } }`, então um único
// parser atende as duas direções e o balão é renderizado de forma idêntica.

import type { WhatsAppMessage } from '@/repositories/whatsapp-repository'

export interface WhatsAppLocation {
  latitude: number
  longitude: number
  name: string
  address: string
  // Miniatura estática do mapa (data URI), quando o WhatsApp envia o jpegThumbnail.
  thumbnail: string | null
  // Link para abrir a localização no mapa (Google Maps).
  mapsUrl: string
}

export interface WhatsAppContact {
  name: string
  phone: string
  businessDescription: string | null
}

function parseRawPayload(message: Pick<WhatsAppMessage, 'rawPayload'>): any {
  if (!message?.rawPayload) return null
  try {
    return JSON.parse(message.rawPayload)
  } catch {
    return null
  }
}

// O conteúdo pode vir em `msgContent` (formato do webhook e do que gravamos ao enviar) ou, por
// segurança, direto na raiz do payload.
function getContent(parsed: any): any {
  if (!parsed || typeof parsed !== 'object') return null
  return parsed.msgContent || parsed
}

export function parseWhatsAppLocation(message: Pick<WhatsAppMessage, 'rawPayload'>): WhatsAppLocation | null {
  const content = getContent(parseRawPayload(message))
  const loc = content?.locationMessage
  if (!loc) return null

  const latitude = Number(loc.degreesLatitude)
  const longitude = Number(loc.degreesLongitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const thumb = typeof loc.jpegThumbnail === 'string' && loc.jpegThumbnail ? loc.jpegThumbnail : null

  return {
    latitude,
    longitude,
    name: String(loc.name || '').trim(),
    address: String(loc.address || '').trim(),
    thumbnail: thumb ? `data:image/jpeg;base64,${thumb}` : null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  }
}

// Extrai nome e telefone de um vCard (formato 3.0 entregue pela W-API). Aceita quebras de linha
// reais (\n, \r\n) ou escapadas (\\n) — dependendo de como o provedor serializa o vCard.
function parseVCard(vcard: string): { name: string; phone: string } {
  const lines = String(vcard || '')
    .replace(/\\r\\n|\\n|\r\n/g, '\n')
    .split('\n')
  let name = ''
  let phone = ''

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const upper = line.toUpperCase()
    if (upper.startsWith('FN:') && !name) {
      name = line.slice(3).trim()
    } else if (upper.startsWith('TEL') && !phone) {
      // Prioriza o `waid=` (só dígitos, formato universal do WhatsApp); senão usa o valor após ":".
      const waid = line.match(/waid=(\d+)/i)?.[1]
      const afterColon = line.slice(line.indexOf(':') + 1).trim()
      phone = waid || afterColon
    }
  }

  return { name, phone }
}

export function parseWhatsAppContact(message: Pick<WhatsAppMessage, 'rawPayload'>): WhatsAppContact | null {
  const content = getContent(parseRawPayload(message))
  const contact = content?.contactMessage
  if (!contact) return null

  const fromVCard = parseVCard(contact.vcard || '')
  const name = String(contact.displayName || fromVCard.name || '').trim()
  const phone = String(contact.phone || fromVCard.phone || '').trim()
  if (!name && !phone) return null

  const description = String(contact.businessDescription || '').trim()

  return {
    name: name || 'Contato',
    phone,
    businessDescription: description || null,
  }
}

// Link "wa.me" para iniciar conversa com o telefone do contato (somente dígitos).
export function contactWhatsAppUrl(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}
