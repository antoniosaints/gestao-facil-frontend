export const printTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Teste</title>

<style>
    @page {
        margin: 0;
        size: 80mm auto;
    }

    body {
        font-family: Arial, sans-serif;
        width: 72mm;               /* área útil real */
        margin: 0 auto;
        padding: 6px 4px;          /* padding suave */
        font-size: 11px;           /* tamanho ideal para térmica */
        line-height: 1.3;
    }

    .container {
        width: 100%;
        text-align: center;
    }

    .line {
        margin: 5px 0;
        word-wrap: break-word;
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
        <div class="hr"></div>
        <div class="line">Impressora {{printer}} conectada com sucesso.</div>
        <div class="line">Tamanho configurado: {{tamanhoPapel}}</div>
        <div class="hr"></div>
        <div class="line">*** FIM DO TESTE ***</div>
    </div>
</body>
</html>
`

export const getTemplateTesteImpressao = (tamanhoPapel: string, printer: string | null) => {
  return printTemplate
    .replace('{{data}}', new Date().toLocaleString('pt-BR'))
    .replace('{{printer}}', printer || '')
    .replace('{{tamanhoPapel}}', tamanhoPapel)
}
