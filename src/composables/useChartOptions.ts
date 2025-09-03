import { colorTheme } from '@/utils/theme'
import { computed } from 'vue'

const currentColor = computed(() => (colorTheme.value === 'dark' ? '#ffffff' : '#000000'))

export const optionsChartBar = computed(() => ({
  responsive: true,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: currentColor.value } },
    y1: {
      ticks: { color: currentColor.value },
      type: 'linear',
      position: 'left',
      title: { display: true, text: 'Valor Total (R$)', color: currentColor.value },
      stacked: false,
    },
    y2: {
      ticks: { color: currentColor.value },
      type: 'linear',
      position: 'right',
      title: { display: true, text: 'Quantidade de Vendas', color: currentColor.value },
      grid: { drawOnChartArea: false },
      stacked: false,
    },
  },
  elements: { bar: { borderRadius: 6 } },
}))

export const optionsChartLine = computed(() => ({
  interaction: { mode: 'index', intersect: false },
  plugins: { title: { display: false }, legend: { display: false } },
  scales: {
    y: { ticks: { color: currentColor.value } },
    x: { ticks: { color: currentColor.value } },
  },
}))
