<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { Calendar, Clock, MapPin, MessageCircle, ShoppingCart, Tags, Trash } from "lucide-vue-next"
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
import ModalView from "@/components/formulario/ModalView.vue"

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
  reservada: boolean
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
const showModalConfirm = ref(false)

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

function mergeConsecutive(items: any[]) {
  if (!items.length) return []

  const sorted = [...items].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const result: CartItem[] = [{ ...sorted[0], price: Number(sorted[0].price) }]

  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1]
    const current = { ...sorted[i], price: Number(sorted[i].price) }

    const sameQuadra = last.quadraId === current.quadraId
    const sameDate =
      new Date(last.date).toDateString() === new Date(current.date).toDateString()

    const consecutive = last.endTime === current.startTime

    if (sameQuadra && sameDate && consecutive) {
      last.endTime = current.endTime
      last.price = Number(last.price) + current.price
    } else {
      result.push(current)
    }
  }

  return result
}


const mergedCart = computed(() => {
  const payload = cartItems.value.map((item) => ({
    quadra: item.quadra,
    quadraId: item.quadraId,
    price: item.price,
    date: item.date,
    startTime: item.startTime,
    endTime: item.endTime,
  }))

  return mergeConsecutive([...payload])
})


async function reservar() {
  try {
    const payload = cartItems.value.map((item) => ({
      quadraId: item.quadraId,
      preco: item.price,
      date: item.date.toISOString(),
      startTime: item.startTime,
      endTime: item.endTime,
    }))

    console.log(mergeConsecutive([...payload]))
    toast.success('Reservas realizadas com sucesso!')
    showCart.value = false
  } catch (error) {
    toast.error('Erro ao reservar, tente novamente!')
  }
}

function generateWhatsAppLink() {
  if (!cartItems.value.length) return toast.error("Nenhuma reserva selecionada.")
  if (!conta.value) return toast.error("Erro com o ID da conta, recarregue a página!")
  const telefone = conta.value.telefone

  if (!telefone) return toast.error("Erro com o telefone da conta, verifique com o gestor do sistema!")

  const telefoneLimpo = telefone.replace(/\D/g, "")
  const telefonePadraoInternacional = `55${telefoneLimpo}`

  const formatBR = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

  const linhas = mergedCart.value.map(item => {
    const date = item.date.toLocaleDateString("pt-BR")
    const horaInicio = new Date(item.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    const horaFim = new Date(item.endTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    const preco = formatCurrencyBR(item.price)

    return `${date} | de ${horaInicio} até ${horaFim} | ${preco}`
  })

  const total = formatBR(cartItems.value.reduce((t, i) => t + Number(i.price), 0))

  const msg =
    `Olá! Gostaria de reservar os seguintes horários na quadra ${selectedQuadra.value?.name}:%0A%0A` +
    linhas.join("%0A") +
    `%0A%0ATotal: ${total}`

  const url = `https://wa.me/${telefonePadraoInternacional}?text=${msg}`

  window.open(url, "_blank")
}


const canBookingWithoutPayment = computed(() => {
  const quadra = selectedQuadra.value
  return quadra && quadra.aprovarSemPagamento
})

watch(() => selectedDate.value, () => {
  if (selectedQuadra.value) {
    getHorariosDisponiveis(selectedQuadra.value)
  }
})
</script>

<template>
  <div class="min-h-screen p-4 relative"
    style="background-image: linear-gradient(135deg, #127bb0 0%, #124b96 100%); background-size: cover; background-position: center; background-attachment: fixed;">
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
      <div v-if="mergedCart.length > 0" class="fixed bottom-4 right-4 z-50">
        <Button @click="showCart = true"
          class="bg-primary border hover:bg-primary/90 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg relative">
          <ShoppingCart class="h-6 w-6" />
          <span
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {{ mergedCart.length }}
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
              :class="selectedQuadra?.id === quadra.id ? 'border-primary dark:border-blue-400 bg-primary/10' : ''">
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
                  <p class="text-xs text-muted-foreground dark:text-gray-200">/hora</p>
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
            <div v-if="!filteredHorarios.length"
              class="flex flex-col justify-center col-span-2 gap-2 items-center space-x-2">
              <Clock class="h-10 w-10 inline-flex text-gray-500 dark:text-gray-300" :stroke-width="2.5" />
              <p class="text-sm text-muted-foreground dark:text-gray-200">Nenhum horário disponível</p>
            </div>
            <Button class="text-white disabled:bg-secondary" v-for="(hora, index) in filteredHorarios" :key="index"
              @click="addToCart(selectedQuadra, selectedDate, hora.start, hora.end)" :disabled="hora.reservada"
              :class="[isTimeSlotInCart(selectedQuadra.id!, selectedDate, hora.start) ? 'bg-warning hover:bg-warning/80' : 'bg-primary hover:bg-primary/80']">
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
      <div v-if="showCart" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-900 rounded-lg p-6 w-[90%] max-w-lg">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Carrinho</h2>
            <p>Horários: {{ mergedCart.length }}</p>
          </div>
          <div v-if="!mergedCart.length">
            <p class="text-muted-foreground flex flex-col items-center justify-center">
              <Clock class="h-14 w-14" />
              Nenhum horário selecionado.
            </p>
          </div>
          <div v-for="(item, index) in mergedCart" :key="index" class="flex justify-between items-center border-b py-2">
            <div>
              <p>
                {{ item.quadra.name }}
                <span class="text-sm text-muted-foreground border px-3 py-0 rounded-md">
                  {{ format(item.startTime, "HH:mm", { locale: ptBR }) }}
                  até
                  {{ format(item.endTime, "HH:mm", { locale: ptBR }) }}
                </span>
              </p>
              <p class="text-sm text-muted-foreground flex items-center">
                {{ item.date.toLocaleDateString() }}
                |
                {{ formatCurrencyBR(item.price) }}
              </p>
            </div>
            <Button variant="destructive" size="sm" @click="removeFromCart(index)">
              <Trash class="h-5 w-5" />
            </Button>
          </div>
          <div v-if="mergedCart.length">
            <p class="mt-4 font-semibold text-xl">Total: {{ formatCurrencyBR(totalPrice) }}</p>

            <p class="text-sm text-muted-foreground">
              As reservas devem ser feitas e confirmadas com 30 minutos antes do
              horário, para evitar
              cancelamentos.
            </p>

            <div class="grid grid-cols-2 gap-2" v-if="!canBookingWithoutPayment">
              <Button class="flex-1 text-white text-md col-span-2 md:col-span-1" @click="reservar">Pagar 100%</Button>
              <Button variant="outline" @click="showModalConfirm = true"
                class="flex-1 text-md col-span-2 md:col-span-1">
                Reservar (50%) - {{ formatCurrencyBR((totalPrice / 2)) }}
              </Button>
            </div>
            <div class="flex gap-2 mt-4" v-else>
              <Button class="flex-1 text-white text-md" @click="showModalConfirm = true">Reservar</Button>
            </div>
            <Button variant="outline" @click="generateWhatsAppLink"
              class="flex-1 col-span-2 w-full mt-2 text-white h-10 text-md bg-success hover:bg-success/80 hover:text-white">
              <MessageCircle />
              Reservar no WhatsApp
            </Button>
          </div>

          <Button variant="outline" class="mt-4 w-full" @click="showCart = false">Fechar carrinho</Button>
        </div>
      </div>
    </div>

    <ModalView v-model:open="showModalConfirm" title="Reservar horário"
      description="Informe seus dados para confirmar a reserva" size="md">
      <!-- <form class="flex flex-col px-4 gap-4">
        <Input id="name" v-model="name" placeholder="Nome completo" />
        <Input id="email" v-model="email" placeholder="E-mail" />
        <Input id="phone" v-model="phone" placeholder="Telefone" />
        <Button class="mt-2 text-white" type="button" @click="submit" variant="default">Confirmar</Button>
      </form> -->
    </ModalView>
  </div>
</template>
