<script setup lang="ts">
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
} from 'chart.js'
import { Pie } from 'vue-chartjs'

// Registrando componentes do ChartJS
ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale)

defineProps<{
  data: any,
  options?: any
}>()
</script>

<template>
  <Pie :data="data" :options="options" />
</template>
