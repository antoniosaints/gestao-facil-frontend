/**
 * Escolhe quantas colunas deixam a grade mais cheia.
 *
 * Grades com número fixo de colunas abrem buracos quando a lista encolhe — é o que acontece na
 * dashboard quando um módulo está inativo ou oculto (3 blocos numa grade de 4, 9 KPIs numa de 4).
 *
 * Quem garante a ausência de lacunas é o `flex-grow` do AutoGrid: os itens da última linha
 * esticam para ocupar a sobra. Esta função é o ajuste estético em cima disso — evita o caso
 * feio de um único card sozinho esticado na largura inteira (9 itens em 4 colunas deixa 1
 * órfão; em 3 colunas fecha exatamente).
 *
 * A busca fica entre `max` e `max - 1` de propósito: minimizar órfãos sem limite escolheria
 * 2 colunas para 10 itens (5 linhas estreitas), que é pior do que 4 colunas com 2 órfãos.
 */
export function melhorColunas(total: number, max: number): number {
  if (total <= 1) return 1

  const maxColunas = Math.min(total, Math.max(1, max))
  const minColunas = Math.max(2, maxColunas - 1)

  let melhor = maxColunas
  let menorSobra = Number.POSITIVE_INFINITY

  // Do maior para o menor: em caso de empate na sobra, fica com o layout mais largo.
  for (let colunas = maxColunas; colunas >= minColunas; colunas--) {
    const sobra = (colunas - (total % colunas)) % colunas
    if (sobra < menorSobra) {
      menorSobra = sobra
      melhor = colunas
    }
  }

  return melhor
}
