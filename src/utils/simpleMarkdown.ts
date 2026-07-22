// Renderizador de Markdown enxuto para textos gerados pela IA (insights, resumos).
// Cobre títulos (#, ##, ###), negrito (**), itálico (*), listas com "- "/"* ",
// tabelas com pipe e parágrafos. Escapa HTML antes de aplicar a formatação
// (seguro para v-html).

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

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2
}

/// Linha separadora do cabeçalho: | --- | :--- | ---: |
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  return isTableRow(trimmed) && trimmed.includes('-') && /^\|[\s:|-]+\|$/.test(trimmed)
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
}

/// Alinhamento por coluna, lido da linha separadora (:--- , ---: , :---:).
function parseAlignments(separator: string): string[] {
  return splitCells(separator).map((cell) => {
    const inicio = cell.startsWith(':')
    const fim = cell.endsWith(':')
    if (inicio && fim) return 'center'
    if (fim) return 'right'
    return 'left'
  })
}

/// Monta o HTML de uma tabela já delimitada. `formatCell` permite ao chamador
/// aplicar (ou não) formatação inline nas células — o chat aplica a dele depois.
function buildTableHtml(
  headerLine: string,
  separatorLine: string,
  bodyLines: string[],
  formatCell: (cell: string) => string,
): string {
  const alinhamentos = parseAlignments(separatorLine)
  const alinhamento = (indice: number) => alinhamentos[indice] || 'left'

  const ths = splitCells(headerLine)
    .map((cell, indice) => `<th style="text-align:${alinhamento(indice)}">${formatCell(cell)}</th>`)
    .join('')

  const trs = bodyLines
    .map((linha) => {
      const tds = splitCells(linha)
        .map((cell, indice) => `<td style="text-align:${alinhamento(indice)}">${formatCell(cell)}</td>`)
        .join('')
      return `<tr>${tds}</tr>`
    })
    .join('')

  // O wrapper com scroll evita que uma tabela larga estoure o balão do chat no mobile.
  return `<div class="md-table-wrap"><table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`
}

/// Converte blocos de tabela em HTML de uma linha só, preservando o resto do texto.
/// Usado pelo chat do Core IA, que tem renderizador próprio (código, links, citações)
/// e só precisa desta parte. O texto de entrada deve vir com HTML já escapado.
export function renderMarkdownTables(
  input: string,
  formatCell: (cell: string) => string = (cell) => cell,
): string {
  if (!input) return ''
  const lines = input.split('\n')
  const saida: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()

    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const corpo: string[] = []
      let cursor = i + 2
      while (cursor < lines.length && isTableRow(lines[cursor])) {
        corpo.push(lines[cursor])
        cursor++
      }

      saida.push(buildTableHtml(line, lines[i + 1], corpo, formatCell))
      i = cursor - 1
      continue
    }

    saida.push(lines[i])
  }

  return saida.join('\n')
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)

    // Tabela: só vira <table> quando a linha seguinte é o separador do cabeçalho.
    // Sem isso, um texto solto com "|" viraria tabela quebrada.
    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      closeList()

      const corpo: string[] = []
      let cursor = i + 2
      while (cursor < lines.length && isTableRow(lines[cursor])) {
        corpo.push(lines[cursor])
        cursor++
      }

      html.push(buildTableHtml(line, lines[i + 1], corpo, inline))
      i = cursor - 1
      continue
    }

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
