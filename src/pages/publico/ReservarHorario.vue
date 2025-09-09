<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { Calendar, Clock, ShoppingCart, Building } from "lucide-vue-next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"

// Tipos simulados
interface Quadra {
  id: string
  nome: string
  tipo: string
  precoPorHora: number
  ativa: boolean
}

interface CartItem {
  quadraId: string
  quadra: Quadra
  date: Date
  startTime: string
  endTime: string
  price: number
}

// Mock de dados (substituir pelo seu contexto/axios)
const quadras = ref<Quadra[]>([
  { id: "1", nome: "Quadra A", tipo: "futebol", precoPorHora: 100, ativa: true },
  { id: "2", nome: "Quadra B", tipo: "vôlei", precoPorHora: 80, ativa: true },
])

const reservas = ref([]) // aqui viriam as reservas existentes

const route = useRoute()
const arenaId = route.params.arenaId as string

const selectedDate = ref<Date>(new Date())
const selectedQuadra = ref<Quadra | null>(null)
const cartItems = ref<CartItem[]>([])
const showCart = ref(false)

const activeQuadras = computed(() => quadras.value.filter((q) => q.ativa))

onMounted(() => {
  if (activeQuadras.value.length > 0 && !selectedQuadra.value) {
    selectedQuadra.value = activeQuadras.value[0]
  }
})

function addToCart(quadra: Quadra, date: Date, startTime: string, endTime: string) {
  const cartItem: CartItem = {
    quadraId: quadra.id,
    quadra,
    date,
    startTime,
    endTime,
    price: quadra.precoPorHora,
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

function isTimeSlotInCart(quadraId: string, date: Date, startTime: string) {
  return cartItems.value.some(
    (item) =>
      item.quadraId === quadraId &&
      item.date.toDateString() === date.toDateString() &&
      item.startTime === startTime
  )
}

const totalPrice = computed(() =>
  cartItems.value.reduce((total, item) => total + item.price, 0)
)
</script>

<template>
  <div
    class="min-h-screen p-4 relative"
    style="background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%); background-size: cover; background-position: center; background-attachment: fixed;"
  >
    <div class="max-w-md mx-auto space-y-6">
      <!-- Header -->
      <div class="text-center py-6">
        <div class="flex items-center justify-center space-x-4 mb-4">
          <div class="h-16 w-16 bg-white/20 rounded-lg flex items-center justify-center">
            <Building class="h-8 w-8 text-white" />
          </div>
          <div class="text-white">
            <h1 class="text-2xl font-bold">{{ arenaId }}</h1>
            <p class="text-white/80">Agendamento Online</p>
          </div>
        </div>
        <p class="text-white/90 mt-2">Escolha o dia e horário perfeito para você</p>
      </div>

      <!-- Carrinho flutuante -->
      <div v-if="cartItems.length > 0" class="fixed bottom-4 right-4 z-50">
        <Button
          @click="showCart = true"
          class="bg-primary hover:bg-primary/90 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg relative"
        >
          <ShoppingCart class="h-6 w-6" />
          <span
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
          >
            {{ cartItems.length }}
          </span>
        </Button>
      </div>

      <!-- Seleção de Quadra -->
      <Card class="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Clock class="h-5 w-5" />
            <span>Escolha a Quadra</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-3">
            <div
              v-for="quadra in activeQuadras"
              :key="quadra.id"
              @click="selectedQuadra = quadra"
              class="p-4 rounded-lg border-2 cursor-pointer transition-all"
              :class="selectedQuadra?.id === quadra.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold">{{ quadra.nome }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {{ quadra.tipo }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-bold text-primary dark:text-gray-100">
                    R$ {{ quadra.precoPorHora.toFixed(2) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-200">/hora</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Seleção de Data -->
      <Card v-if="selectedQuadra" class="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
        <CardHeader>
          <CardTitle class="flex items-center space-x-2">
            <Calendar class="h-5 w-5" />
            <span>Escolha a Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <!-- Substituir pelo seu componente de calendário -->
          <Calendarpicker v-model="selectedDate" />
        </CardContent>
      </Card>

      <!-- Horários Disponíveis -->
      <Card v-if="selectedQuadra && selectedDate" class="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
        <CardHeader>
          <CardTitle>Horários Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <!-- Mock de horários -->
          <div class="grid grid-cols-2 gap-2">
            <Button
              v-for="hora in ['09:00', '10:00', '11:00', '14:00', '15:00']"
              :key="hora"
              @click="addToCart(selectedQuadra, selectedDate, hora, hora)"
              :variant="isTimeSlotInCart(selectedQuadra.id, selectedDate, hora) ? 'secondary' : 'default'"
            >
              {{ hora }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Modal de Carrinho -->
      <div
        v-if="showCart"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
          <h2 class="text-lg font-bold mb-4">Carrinho</h2>
          <div v-for="(item, index) in cartItems" :key="index" class="flex justify-between border-b py-2">
            <div>
              <p>{{ item.quadra.nome }} - {{ item.startTime }}</p>
              <p class="text-sm text-gray-500">{{ item.date.toLocaleDateString() }}</p>
            </div>
            <Button variant="destructive" size="sm" @click="removeFromCart(index)">Remover</Button>
          </div>

          <p class="mt-4 font-semibold">Total: R$ {{ totalPrice.toFixed(2) }}</p>

          <div class="flex gap-2 mt-4">
            <Button class="flex-1">Pagar 100%</Button>
            <Button variant="outline" class="flex-1">
              Reservar (50%) - R$ {{ (totalPrice / 2).toFixed(2) }}
            </Button>
          </div>

          <Button variant="outline" class="mt-4 w-full" @click="showCart = false">Voltar</Button>
        </div>
      </div>
    </div>
  </div>
</template>
