<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { Calendar, Clock, MapPin, ShoppingCart } from "lucide-vue-next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import type { ArenaQuadras, Contas } from "@/types/schemas"
import { useToast } from "vue-toastification"
import { ArenaQuadrasRepository } from "@/repositories/quadras-repository"
import { HashGenerator } from "@/utils/generators"
import http from "@/utils/axios"
import { env } from "@/utils/dotenv"
import { formatCurrencyBR } from "@/utils/formatters"
import { ArenaReservasRepository } from "@/repositories/reservas-repository"
import { endOfDay, format, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CartItem {
  quadraId: number
  quadra: ArenaQuadras
  date: Date
  startTime: string
  endTime: string
  price: number
}

interface HorariosReservar {
  start: string
  end: string
}

const toast = useToast()
const route = useRoute()
const contaId = ref(HashGenerator.decode(String(route.params.conta))[0])
const conta = ref<Contas | null>(null)
const quadras = ref<ArenaQuadras[]>()
const reservasDisponiveis = ref<HorariosReservar[]>([])
const loading = ref(false)
const selectedDate = ref<Date>(new Date())
const selectedQuadra = ref<ArenaQuadras | null>(null)
const cartItems = ref<CartItem[]>([])
const showCart = ref(false)

const logo = computed(() => {
  const url = env.VITE_BACKEND_URL
  return url + '/' + conta.value?.profile + '?_t=' + Date.now()
})

async function getQuadras() {
  try {
    loading.value = true
    if (!contaId.value || !Number(contaId.value)) return toast.error('Erro com o ID da conta, recarregue a página!');
    const [res1, res2] = await Promise.all([
      ArenaQuadrasRepository.getPublico(Number(contaId.value)),
      http.get(`/contas/publico/detalhes?id=${contaId.value}`)
    ])
    conta.value = res2.data.data
    quadras.value = res1.data
  } catch (error) {
    toast.error('Erro ao buscar as quadras, recarregue a página!')
  } finally {
    loading.value = false
  }
}

async function getHorariosDisponiveis(quadra: ArenaQuadras) {
  try {
    loading.value = true
    if (!contaId.value || !Number(contaId.value)) return toast.error('Erro com o ID da conta, recarregue a página!');
    const horarios = await ArenaReservasRepository.getHorariosPublicoReservar(
      Number(contaId.value),
      quadra.id!,
      format(startOfDay(selectedDate.value), "yyyy-MM-dd'T'HH:mm:ss"),
      format(endOfDay(selectedDate.value), "yyyy-MM-dd'T'HH:mm:ss")
    )
    cartItems.value = []
    selectedQuadra.value = quadra
    reservasDisponiveis.value = horarios.data
  } catch (error) {
    toast.error('Erro ao buscar os horários, recarregue a página!')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (quadras.value && quadras.value.length > 0 && !selectedQuadra.value) {
    selectedQuadra.value = quadras.value[0]
  }

  getQuadras()
})

function addToCart(quadra: ArenaQuadras, date: Date, startTime: string, endTime: string) {
  const cartItem: CartItem = {
    quadraId: quadra.id!,
    quadra,
    date,
    startTime,
    endTime,
    price: quadra.precoHora,
  }

  const exists = cartItems.value.some(
    (item) =>
      item.quadraId === quadra.id &&
      item.date.toDateString() === date.toDateString() &&
      item.startTime === startTime
  )

  if (!exists) {
    cartItems.value.push(cartItem)
  }
}

function removeFromCart(index: number) {
  cartItems.value.splice(index, 1)
}

const filteredHorarios = computed(() => {
  const now = new Date()
  return reservasDisponiveis.value.filter((horario) => {
    const date = new Date(horario.start)
    return date >= now
  })
})

function isTimeSlotInCart(quadraId: number, date: Date, startTime: string) {
  return cartItems.value.some(
    (item) =>
      item.quadraId === quadraId &&
      item.date.toDateString() === date.toDateString() &&
      item.startTime === startTime
  )
}

const totalPrice = computed(() =>
  cartItems.value.reduce((total, item) => total + Number(item.price), 0)
)
</script>

<template>
  <div class="min-h-screen p-4 relative"
    style="background-image: linear-gradient(135deg, #127bb0 0%, #123cb0 100%); background-size: cover; background-position: center; background-attachment: fixed;">
    <div class="max-w-md mx-auto flex flex-col gap-4">
      <!-- Header -->
      <div class="text-center py-6">
        <div class="flex items-center justify-center space-x-4 mb-4">
          <div class="h-16 w-16 bg-white/20 rounded-lg flex items-center justify-center">
            <img :src="logo" alt="Logo" class="w-14 h-14 rounded-lg">
          </div>
          <div class="text-white">
            <h1 class="text-2xl">{{ conta?.nome }}</h1>
            <p class="text-white/80">Agendamento Online</p>
          </div>
        </div>
        <p class="text-white/90 mt-2">Escolha o dia e horário perfeito para você</p>
      </div>

      <!-- Carrinho flutuante -->
      <div v-if="cartItems.length > 0" class="fixed bottom-4 right-4 z-50">
        <Button @click="showCart = true"
          class="bg-primary hover:bg-primary/90 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg relative">
          <ShoppingCart class="h-6 w-6" />
          <span
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {{ cartItems.length }}
          </span>
        </Button>
      </div>

      <!-- Seleção de Quadra -->
      <Card class="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2 font-normal">
            <MapPin class="h-5 w-5" />
            <span>Escolha a Quadra</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-3">
            <div v-for="quadra in quadras" :key="quadra.id" @click="getHorariosDisponiveis(quadra)"
              class="p-4 rounded-lg border-2 cursor-pointer transition-all"
              :class="selectedQuadra?.id === quadra.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="text-lg">{{ quadra.name }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {{ quadra.description }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-primary dark:text-gray-100">
                    {{ formatCurrencyBR(quadra.precoHora) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-200">/hora</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Seleção de Data -->
      <Card v-if="selectedQuadra" class="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 z-50">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2 font-normal">
            <Calendar class="h-5 w-5" />
            <span>Escolha a Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendarpicker v-model="selectedDate" />
        </CardContent>
      </Card>

      <!-- Horários Disponíveis -->
      <Card v-if="selectedQuadra && selectedDate" class="bg-white/90 dark:bg-gray-800/90">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2 gap-2 font-normal">
            <Clock class="h-5 w-5" />
            Horários Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <!-- Mock de horários -->
          <div class="grid grid-cols-2 gap-2">
            <Button class="text-white" v-for="(hora, index) in filteredHorarios" :key="index"
              @click="addToCart(selectedQuadra, selectedDate, hora.start, hora.end)"
              :variant="isTimeSlotInCart(selectedQuadra.id!, selectedDate, hora.start) ? 'secondary' : 'default'">
              {{ format(new Date(hora.start), "HH:mm", {
                locale: ptBR
              }) }} - {{ format(new Date(hora.end), "HH:mm", {
                locale: ptBR
              }) }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Modal de Carrinho -->
      <div v-if="showCart" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-[90%] max-w-lg">
          <h2 class="text-lg font-bold mb-4">Carrinho</h2>
          <div v-for="(item, index) in cartItems" :key="index" class="flex justify-between border-b py-2">
            <div>
              <p>{{ item.quadra.name }} - {{ format(item.startTime, "HH:mm", { locale: ptBR }) }} - {{
                format(item.endTime, "HH:mm", { locale: ptBR }) }}</p>
              <p class="text-sm text-gray-500">{{ item.date.toLocaleDateString() }}</p>
            </div>
            <Button variant="destructive" size="sm" @click="removeFromCart(index)">Remover</Button>
          </div>

          <p class="mt-4 font-semibold">Total: {{ formatCurrencyBR(totalPrice) }}</p>

          <div class="flex gap-2 mt-4">
            <Button class="flex-1 text-white">Pagar 100%</Button>
            <Button variant="outline" class="flex-1">
              Reservar (50%) - {{ formatCurrencyBR((totalPrice / 2)) }}
            </Button>
          </div>

          <Button variant="outline" class="mt-4 w-full" @click="showCart = false">Voltar</Button>
        </div>
      </div>
    </div>
  </div>
</template>
