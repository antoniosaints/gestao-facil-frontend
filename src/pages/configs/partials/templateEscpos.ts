export const getTemplateTesteEscPos = (tamanhoPapel: string, printer: string | null) => {
  const data = new Date().toLocaleString('pt-BR')

  return [
    '\x1B\x40', // Reset
    '\x1B\x61\x01', // Centraliza
    '---- TESTE DE IMPRESSÃO ----\n',
    '\n',

    `Data: ${data}\n`,
    '\n',

    '------------------------------\n',
    '\n',

    `Impressora: ${printer || 'Desconhecida'}\n`,
    `Papel: ${tamanhoPapel}\n`,
    '\n',

    '------------------------------\n',
    '\n',

    '*** FIM DO TESTE ***\n',
    '\n',
    '\x1B\x64\x04', // Alimenta 2 linhas
    // '\x1D\x56\x01', // Corta o papel (se tiver guilhotina)
    '\x1D\x56\x00', // Corte total
  ].join('')
}
