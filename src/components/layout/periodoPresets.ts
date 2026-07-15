import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns'

/**
 * Atalhos de período usados nos painéis de vendas e de produtos. Extraídos para cá porque a
 * dashboard principal passou a usar os mesmos, e a regra de cada atalho precisa ser a mesma
 * nos três lugares — "30 dias" não pode significar coisas diferentes dependendo da tela.
 */

export type PeriodoPresetKey = 'today' | '7d' | '30d' | 'month' | 'last-month'

export const PERIODO_PRESETS: ReadonlyArray<{ key: PeriodoPresetKey; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'last-month', label: 'Mês passado' },
]

/**
 * Intervalo de um atalho. `agora` é injetável para tornar a função testável sem depender do
 * relógio da máquina.
 *
 * "7 dias" inclui hoje e volta 6 dias (7 dias no total), como já era em vendas e produtos.
 */
export function intervaloDoPreset(preset: PeriodoPresetKey, agora: Date = new Date()): [Date, Date] {
  switch (preset) {
    case 'today':
      return [startOfDay(agora), endOfDay(agora)]
    case '7d':
      return [startOfDay(subDays(agora, 6)), endOfDay(agora)]
    case '30d':
      return [startOfDay(subDays(agora, 29)), endOfDay(agora)]
    case 'last-month': {
      const mesPassado = subMonths(agora, 1)
      return [startOfMonth(mesPassado), endOfMonth(mesPassado)]
    }
    case 'month':
    default:
      return [startOfMonth(agora), endOfMonth(agora)]
  }
}
