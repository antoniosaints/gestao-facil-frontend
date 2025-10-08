<script setup lang="ts">
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  CategoryScale,
  PointElement,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'

// Registrando componentes do ChartJS
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

defineProps<{
  data: any,
  options?: any
}>()
</script>

<template>
  <Bar :data="data" :options="options" />
</template>
