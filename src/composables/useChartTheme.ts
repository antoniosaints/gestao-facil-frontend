import { computed } from 'vue'
import { colorTheme } from '@/utils/theme'
import { formatCurrencyBR } from '@/utils/formatters'

/**
 * Estilo padrão dos gráficos (mesmo visual dos painéis de Vendas/Produtos):
 * cores derivadas do tema (--primary), ticks/tooltip em R$, grid do eixo X oculto,
 * `maintainAspectRatio: false` (os gráficos ficam em containers de altura fixa).
 *
 * Os painéis ainda mantêm cópias inline desses helpers; podem migrar para cá no futuro.
 */

export const PALETTE = [
  '#2563EB', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#06B6D4', '#EC4899', '#84CC16',
]

export function themeColor(name: string, alpha?: number) {
  if (typeof document === 'undefined') return '#2563EB'
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!value) return '#2563EB'
  return alpha != null ? `hsl(${value} / ${alpha})` : `hsl(${value})`
}

export function useChartTheme() {
  const primary = computed(() => {
    void colorTheme.value
    return themeColor('--primary')
  })
  const primarySoft = computed(() => {
    void colorTheme.value
    return themeColor('--primary', 0.16)
  })
  const tickColor = computed(() => (colorTheme.value === 'dark' ? '#cbd5e1' : '#475569'))
  const gridColor = computed(() =>
    colorTheme.value === 'dark' ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.22)',
  )

  const moneyTooltip = {
    callbacks: { label: (ctx: any) => ` ${formatCurrencyBR(ctx.parsed.y ?? ctx.parsed)}` },
  }

  const lineOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: moneyTooltip },
    scales: {
      y: {
        ticks: { color: tickColor.value, callback: (v: number) => 'R$ ' + Number(v).toLocaleString('pt-BR') },
        grid: { color: gridColor.value },
        beginAtZero: true,
      },
      x: {
        ticks: { color: tickColor.value, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
        grid: { display: false },
      },
    },
  }))

  const barOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: moneyTooltip },
    scales: {
      y: {
        ticks: { color: tickColor.value, callback: (v: number) => 'R$ ' + Number(v).toLocaleString('pt-BR') },
        grid: { color: gridColor.value },
        beginAtZero: true,
      },
      x: { ticks: { color: tickColor.value }, grid: { display: false } },
    },
    elements: { bar: { borderRadius: 6 } },
  }))

  // Barra de dois eixos: valor (R$) à esquerda, quantidade (inteiro) à direita.
  const barDualAxisOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ctx.dataset.yAxisID === 'y2'
              ? ` ${ctx.dataset.label}: ${ctx.parsed.y}`
              : ` ${ctx.dataset.label}: ${formatCurrencyBR(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: tickColor.value }, grid: { display: false } },
      y1: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        ticks: { color: tickColor.value, callback: (v: number) => 'R$ ' + Number(v).toLocaleString('pt-BR') },
        grid: { color: gridColor.value },
        title: { display: true, text: 'Valor Total (R$)', color: tickColor.value },
      },
      y2: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        ticks: { color: tickColor.value, precision: 0 },
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Qtd de vendas', color: tickColor.value },
      },
    },
    elements: { bar: { borderRadius: 6 } },
  }))

  return {
    primary,
    primarySoft,
    tickColor,
    gridColor,
    moneyTooltip,
    lineOptions,
    barOptions,
    barDualAxisOptions,
  }
}
