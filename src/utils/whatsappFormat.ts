// Formatação de texto do WhatsApp para HTML seguro (para uso com v-html).
// Suporta os marcadores do WhatsApp: *negrito*, _itálico_, ~tachado~ e ```monoespaçado```.
// O texto é sempre escapado; só injetamos tags conhecidas (strong/em/del/code), sem atributos —
// portanto não há risco de XSS. Quebras de linha são preservadas pelo CSS (white-space: pre-wrap).

const MARKER_TAGS: Record<string, string> = {
  '*': 'strong',
  _: 'em',
  '~': 'del',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function isWordCharacter(value: string): boolean {
  return /[\p{L}\p{N}]/u.test(value)
}

// Marcador de abertura: seguido de conteúdo (não espaço/não o próprio marcador) e precedido por
// início/limite de palavra — evita interpretar "a*b" ou "* item" como formatação.
function isOpeningMarker(text: string, index: number, marker: string): boolean {
  const previous = text[index - 1] || ''
  const next = text[index + 1] || ''
  if (!next || /\s/.test(next) || next === marker) return false
  return !isWordCharacter(previous)
}

function isClosingMarker(text: string, index: number, marker: string): boolean {
  const previous = text[index - 1] || ''
  const next = text[index + 1] || ''
  if (!previous || /\s/.test(previous) || previous === marker) return false
  return !isWordCharacter(next)
}

function findClosingMarker(text: string, marker: string, startIndex: number): number {
  for (let index = startIndex; index < text.length; index += 1) {
    if (text[index] === marker && isClosingMarker(text, index, marker)) return index
  }
  return -1
}

function parseInline(text: string): string {
  let out = ''
  let buffer = ''
  const flush = () => {
    if (buffer) {
      out += escapeHtml(buffer)
      buffer = ''
    }
  }

  let index = 0
  while (index < text.length) {
    // Monoespaçado com ``` ... ``` (sem formatação aninhada dentro).
    if (text.startsWith('```', index)) {
      const end = text.indexOf('```', index + 3)
      if (end !== -1) {
        flush()
        out += `<code>${escapeHtml(text.slice(index + 3, end))}</code>`
        index = end + 3
        continue
      }
    }

    const marker = text[index]
    if (MARKER_TAGS[marker] && isOpeningMarker(text, index, marker)) {
      const closingIndex = findClosingMarker(text, marker, index + 1)
      if (closingIndex !== -1 && text.slice(index + 1, closingIndex).trim()) {
        flush()
        const inner = text.slice(index + 1, closingIndex)
        out += `<${MARKER_TAGS[marker]}>${parseInline(inner)}</${MARKER_TAGS[marker]}>`
        index = closingIndex + 1
        continue
      }
    }

    buffer += text[index]
    index += 1
  }

  flush()
  return out
}

// Converte o texto (markup do WhatsApp) em HTML seguro. Newlines são mantidas no texto e ficam a
// cargo do CSS `white-space: pre-wrap` do balão.
export function formatWhatsAppText(value?: string | null): string {
  return parseInline(String(value ?? ''))
}
