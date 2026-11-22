import { ajudaFinanceira } from '@/components/dashboard/ajudaFinanceira'

const saldoHistorico = 'Diferença entre receitas recebidas e despesas pagas em todo o histórico. Saldos iniciais, parcelas em aberto e contas ignoradas ficam fora deste total.'

export const ajudaDashboard: Readonly<Record<string, string>> = {
  'kpi:faturamento': 'Soma o valor das vendas faturadas ou finalizadas no período selecionado.',
  'kpi:ticket-medio': 'Divide o faturamento pela quantidade de vendas faturadas ou finalizadas no período selecionado.',
  'kpi:saldo-financeiro': saldoHistorico,
  'kpi:clientes': 'Quantidade total de clientes cadastrados na empresa, considerando toda a base.',
  'kpi:catalogo': 'Mostra quantos produtos base, variantes e categorias existem no catálogo atual.',
  'kpi:estoque-critico': 'Conta itens com controle de estoque que estão abaixo ou no limite mínimo cadastrado. O detalhe abaixo separa os itens sem estoque.',
  'kpi:servicos-em-aberto': 'Soma as ordens com status Aberta ou Em andamento no resumo atual de Serviços.',
  'kpi:pendencias-financeiras': 'Soma receitas e despesas em parcelas abertas de todo o histórico. O valor pago exibido abaixo é um total separado.',
  'kpi:caixas-abertos': 'Conta os caixas abertos agora. O saldo esperado reúne os caixas abertos e o tempo indica há quanto tempo o mais antigo está aberto.',
  'kpi:fila-atendimento': 'Conta as conversas que aguardam atendimento agora. O detalhe mostra o maior tempo de espera e quantas conversas já estão em atendimento.',
  'kpi:contratos-ativos': 'Conta os contratos ativos no momento. Para quem tem acesso financeiro, o detalhe mostra a receita mensal recorrente estimada.',
  'kpi:pedidos-loja': 'Conta os pedidos da Loja Virtual no período selecionado. O detalhe mostra quantos aguardam ação e o faturamento da loja no intervalo.',
  metas: 'Compara o resultado acumulado com o objetivo de cada meta. O período e a unidade dependem da configuração daquela meta.',
  alerts: 'Reúne os alertas dos módulos disponíveis para esta conta. Use os links do card para abrir a área que precisa de atenção.',
  trend: 'Compara o faturamento do mês atual com o do mês anterior. Os totais de vendas no detalhe seguem o período selecionado no painel.',
  'summary:vendas': 'Reúne a quantidade de vendas, as faturadas ou finalizadas e o total informado pelo resumo de Vendas no período selecionado.',
  'summary:financeiro': saldoHistorico,
  'summary:produtos': 'Mostra a quantidade de produtos base, os itens em estoque baixo e o valor estimado do estoque atual.',
  'summary:servicos': 'Mostra as quantidades de ordens abertas, em andamento e faturadas no resumo de Serviços.',
  'chart:vendas-mensais': 'Compara o valor em reais e a quantidade de vendas por mês. Cada série tem sua própria escala.',
  'chart:saldo-mensal': 'Mostra a diferença entre receitas e despesas de parcelas pagas, agrupadas pelo mês de vencimento. Cada barra é o resultado do mês, sem acumular saldos iniciais.',
  'chart:ticket-medio-mensal': 'Mostra o faturamento médio por venda em cada mês do intervalo selecionado.',
  'chart:top-produtos': 'Ordena os produtos pela quantidade de unidades vendidas no período. O comprimento da barra usa como referência o item mais vendido.',
  'chart:financeiro-evolucao-saldo': ajudaFinanceira.evolucao,
  'financeiro:assinaturas-a-pagar': ajudaFinanceira.assinaturas,
  'financeiro:resumo-contas': ajudaFinanceira.contas,
}
