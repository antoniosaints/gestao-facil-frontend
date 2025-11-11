export const printTemplate = `
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Impressão</title>
<style>
@page { size: A4; margin: 18mm; }
body { font-family: Arial, sans-serif; font-size:14px; color:#111; }
header { display:flex; justify-content:space-between; margin-bottom:16px; }
.logo { width:80px; height:80px; object-fit:contain; }
.company { font-size:18px; font-weight:bold; }
.meta { font-size:12px; color:#555; }
table { width:100%; border-collapse:collapse; margin-top:10px; }
th, td { border-bottom:1px solid #ddd; padding:6px 4px; }
th { background:#f7f7f7; }
.total-box { margin-top:14px; text-align:right; font-size:16px; }
.footer { margin-top:24px; text-align:center; font-size:12px; color:#555; }
</style>
</head>

<body>
<header>
  <div>
    <div class="company">{{empresa}}</div>
    <div class="meta">CNPJ: {{cnpj}} • {{endereco}} • {{telefone}}</div>
  </div>
  <img src="{{logoBase64}}" class="logo"/>
</header>

<div class="meta">Data: {{data}} • Venda: #{{venda}}</div>
<div class="meta">Cliente: <strong>{{cliente}}</strong> • Operador: {{operador}}</div>

<table>
  <thead>
    <tr>
      <th>Produto</th>
      <th style="width:80px">Qtde</th>
      <th style="width:110px">Preço</th>
      <th style="width:110px">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    {{itens}}
  </tbody>
</table>

<div class="total-box">
  Total: <strong>{{total}}</strong>
</div>

<div class="footer">{{mensagemRodape}}</div>
</body>
</html>
`

interface Itens {
  produto: string
  qtd: string
  precoUnitario: string
  subtotal: string
}
interface TemplateImpressao {
  empresa: string
  cnpj: string
  endereco: string
  telefone: string
  logoBase64: string
  data: string
  venda: string
  cliente: string
  operador: string
  itens: Itens[]
  total: string
  mensagemRodape: string
}

export const getTemplateImpressao = (dados: TemplateImpressao) => {
  let itensHtml = ``

  dados.itens.forEach((row) => {
    itensHtml += `
    <tr>
      <td>${row.produto}</td>
      <td>${row.qtd}</td>
      <td>R$ ${row.precoUnitario}</td>
      <td>R$ ${row.subtotal}</td>
    </tr>
    `
  })

  const html = printTemplate
    .replace('{{empresa}}', dados.empresa)
    .replace('{{cnpj}}', dados.cnpj)
    .replace('{{endereco}}', dados.endereco)
    .replace('{{telefone}}', dados.telefone)
    .replace('{{logoBase64}}', dados.logoBase64)
    .replace('{{data}}', new Date(dados.data).toLocaleString('pt-BR'))
    .replace('{{venda}}', dados.venda)
    .replace('{{cliente}}', dados.cliente)
    .replace('{{operador}}', dados.operador)
    .replace('{{itens}}', itensHtml)
    .replace('{{total}}', dados.total)
    .replace('{{mensagemRodape}}', dados.mensagemRodape)

  return html
}

export const imgBase64 = `data:image/jpeg;base64,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`
