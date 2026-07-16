// Renderizador de Markdown enxuto para textos gerados pela IA (insights, resumos).
// Cobre títulos (#, ##, ###), negrito (**), itálico (*), listas com "- "/"* " e
// parágrafos. Escapa HTML antes de aplicar a formatação (seguro para v-html).

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
}

export function renderMarkdown(input: string): string {
  if (!input) return ''
  const lines = escapeHtml(input).split('\n')
  const html: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)

    if (heading) {
      closeList()
      const level = heading[1].length + 1 // # -> h2, ## -> h3, ### -> h4
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    } else if (bullet) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${inline(bullet[1])}</li>`)
    } else if (!line.trim()) {
      closeList()
    } else {
      closeList()
      html.push(`<p>${inline(line)}</p>`)
    }
  }
  closeList()
  return html.join('\n')
}
