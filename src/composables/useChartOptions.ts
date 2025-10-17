import { colorTheme } from '@/utils/theme'
import { computed } from 'vue'

const currentColor = computed(() => (colorTheme.value === 'dark' ? '#ffffff' : '#000000'))
const currentColorMuted = computed(() => (colorTheme.value === 'dark' ? '#525252' : '#d1d1d1'))

export const optionsChartBar = computed(() => ({
  responsive: true,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: currentColor.value }, grid: { color: currentColorMuted.value } },
    y1: {
      ticks: { color: currentColor.value },
      grid: { drawOnChartArea: false, color: currentColorMuted.value },
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
      grid: { drawOnChartArea: false, color: currentColorMuted.value },
      stacked: false,
    },
  },
  elements: { bar: { borderRadius: 6 } },
}))

export const optionsChartBarDefault = computed(() => ({
  responsive: true,
  interaction: { mode: 'index', intersect: false },
  plugins: { legend: { display: false } },
  scales: {
    y: { ticks: { color: currentColor.value }, grid: { color: currentColorMuted.value } },
    x: { ticks: { color: currentColor.value }, grid: { color: currentColorMuted.value } },
  },
  elements: { bar: { borderRadius: 6 } },
}))

export const optionsChartBarStack = computed(() => ({
  responsive: true,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    y: {
      stacked: true,
      ticks: { color: currentColor.value },
      grid: { display: true, color: currentColorMuted.value },
    },
    x: {
      stacked: true,
      ticks: { color: currentColor.value },
      grid: { display: false, color: currentColorMuted.value },
    },
  },
  elements: {
    bar: { borderRadius: 6 },
  },
}))

export const optionsChartLine = computed(() => ({
  interaction: { mode: 'index', intersect: false },
  plugins: { title: { display: false }, legend: { display: false } },
  scales: {
    y: { ticks: { color: currentColor.value } },
    x: { ticks: { color: currentColor.value } },
  },
}))

export const optionsChartPie = computed(() => ({
  interaction: { mode: 'index', intersect: false },
  plugins: {
    title: { display: false },
    legend: { display: false, labels: { color: currentColor.value } },
  },
  scales: {
    y: { ticks: { color: currentColor.value }, display: false },
  },
  elements: { arc: { borderWidth: 0 } },
}))
