<script setup lang="ts">
import { defineProps } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs'

// Registrando componentes do ChartJS
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

defineProps<{
  data: any,
  options?: any
}>()
</script>

<template>
  <Bar :data="data" :options="options" />
</template>
