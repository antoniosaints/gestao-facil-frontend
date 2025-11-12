export const printTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Página de Teste</title>
<style>
    body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        padding: 10px;
    }
    .container {
        width: 100%;
        text-align: center;
    }
    .line {
        margin: 6px 0;
    }
    .hr {
        border-top: 1px dashed #000;
        margin: 8px 0;
    }
</style>
</head>
<body>
    <div class="container">
        <div class="line">--- TESTE DE IMPRESSÃO ---</div>
        <div class="line">Data: {{data}}</div>
        <div class="line hr"></div>
        <div class="line">Impressora {{printer}} conectada com sucesso.</div>
        <div class="line">Tamanho configurado: {{tamanhoPapel}}</div>
        <div class="line hr"></div>
        <div class="line">*** FIM DO TESTE ***</div>
    </div>
</body>
</html>
`

export const getTemplateTesteImpressao = (tamanhoPapel: string, printer: string | null) => {
  const html = printTemplate
    .replace('{{data}}', new Date().toLocaleString('pt-BR'))
    .replace('{{printer}}', printer || '')
    .replace('{{tamanhoPapel}}', tamanhoPapel)

  return html
}
