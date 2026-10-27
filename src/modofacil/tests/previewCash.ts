import { today } from '../application/format'
export const cashSession = {
  id: 1,
  codigo: 'CAI_DEMO_001',
  status: 'ABERTO',
  saldoInicial: 150,
  saldoEsperado: 260,
  abertoEm: today() + 'T08:00:00',
  abertoPor: { id: 1, nome: 'João Silva' },
  pdv: { id: 1, nome: 'Balcão principal' },
}
export const cashSummary = {
  caixa: cashSession,
  resumo: {
    saldoInicial: 150,
    saldoEsperado: 260,
    totalVendido: 420,
    totalVendas: 3,
    totalReforcos: 50,
    totalSangrias: 30,
    porMetodo: { DINHEIRO: 90, PIX: 210, CREDITO: 120 },
  },
  movimentos: [
    {
      id: 1,
      tipo: 'ABERTURA',
      valor: 150,
      descricao: 'Fundo de troco do turno',
      createdAt: today() + 'T08:00:00',
    },
    {
      id: 2,
      tipo: 'VENDA',
      valor: 90,
      descricao: 'Recebimento de venda',
      metodoPagamento: 'DINHEIRO',
      vendaId: 12,
      createdAt: today() + 'T09:15:00',
    },
    {
      id: 3,
      tipo: 'REFORCO',
      valor: 50,
      descricao: 'Reforço para troco',
      createdAt: today() + 'T10:30:00',
    },
    {
      id: 4,
      tipo: 'SANGRIA',
      valor: 30,
      descricao: 'Retirada para depósito',
      createdAt: today() + 'T11:00:00',
    },
  ],
}
