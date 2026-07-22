import { describe, expect, it } from 'vitest'

import { renderMarkdown, renderMarkdownTables } from './simpleMarkdown'

describe('renderMarkdown', () => {
  it('renderiza tabela pipe com cabeçalho e corpo', () => {
    const html = renderMarkdown(
      ['| Categoria | Valor |', '| --- | --- |', '| Vendas | R$ 100 |', '| Custos | R$ 40 |'].join('\n'),
    )

    expect(html).toContain('<table>')
    expect(html).toContain('<th style="text-align:left">Categoria</th>')
    expect(html).toContain('<td style="text-align:left">R$ 100</td>')
    expect(html).toContain('Custos')
    // O wrapper com scroll evita estourar o balão no mobile.
    expect(html).toContain('md-table-wrap')
  })

  it('respeita o alinhamento declarado no separador', () => {
    const html = renderMarkdown(
      ['| Item | Valor |', '| :--- | ---: |', '| Vendas | 100 |'].join('\n'),
    )

    expect(html).toContain('<th style="text-align:left">Item</th>')
    expect(html).toContain('<th style="text-align:right">Valor</th>')
    expect(html).toContain('<td style="text-align:right">100</td>')
  })

  it('não vira tabela sem a linha separadora', () => {
    const html = renderMarkdown('| isso não | é tabela |')

    expect(html).not.toContain('<table>')
    expect(html).toContain('<p>')
  })

  it('continua escapando HTML dentro das células', () => {
    const html = renderMarkdown(
      ['| Campo |', '| --- |', '| <script>alert(1)</script> |'].join('\n'),
    )

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('aplica negrito e itálico dentro da tabela', () => {
    const html = renderMarkdown(['| Item |', '| --- |', '| **Total** |'].join('\n'))

    expect(html).toContain('<strong>Total</strong>')
  })

  it('mantém títulos, listas e parágrafos funcionando', () => {
    const html = renderMarkdown(['## Resumo', '- item um', '- item dois', '', 'Texto final.'].join('\n'))

    expect(html).toContain('<h3>Resumo</h3>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>item um</li>')
    expect(html).toContain('<p>Texto final.</p>')
  })

  it('volta ao fluxo normal depois da tabela', () => {
    const html = renderMarkdown(
      ['| A |', '| --- |', '| 1 |', '', 'Conclusão do período.'].join('\n'),
    )

    expect(html).toContain('<table>')
    expect(html).toContain('<p>Conclusão do período.</p>')
  })
})

// O chat do Core IA tem renderizador próprio (código, links, citações) e usa só esta parte.
describe('renderMarkdownTables', () => {
  it('substitui o bloco por HTML de uma linha e preserva o resto do texto', () => {
    const saida = renderMarkdownTables(
      ['Segue o comparativo:', '| Mês | Valor |', '| --- | --- |', '| Julho | 100 |', 'Fim.'].join('\n'),
    )

    const linhas = saida.split('\n')
    expect(linhas[0]).toBe('Segue o comparativo:')
    // Uma linha só: o chat converte cada \n em <br> depois desta etapa.
    expect(linhas[1]).toContain('<table>')
    expect(linhas[1]).not.toContain('\n')
    expect(linhas[2]).toBe('Fim.')
  })

  it('deixa a formatação inline para o chamador por padrão', () => {
    const saida = renderMarkdownTables(['| Item |', '| --- |', '| **Total** |'].join('\n'))

    // O chat aplica o negrito depois, com as regras dele.
    expect(saida).toContain('**Total**')
  })

  it('não altera texto sem tabela', () => {
    const texto = 'Nenhuma tabela aqui | só um pipe solto.'
    expect(renderMarkdownTables(texto)).toBe(texto)
  })
})
