<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { ArrowBigLeft, ArrowBigRight, Calendar, Check, CheckCheck, CircleDollarSign, Clock, MapPin, MessageCircle, ShoppingCart, Tags, Trash } from "lucide-vue-next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Calendarpicker from "@/components/formulario/calendarpicker.vue"
import type { ArenaQuadras, Contas } from "@/types/schemas"
import { POSITION, useToast } from "vue-toastification"
import { ArenaQuadrasRepository } from "@/repositories/quadras-repository"
import { HashGenerator } from "@/utils/generators"
import http from "@/utils/axios"
import { env } from "@/utils/dotenv"
import { formatCurrencyBR, formatToCapitalize, formatToUpperCase } from "@/utils/formatters"
import { ArenaReservasRepository, type SaveReservaPublico } from "@/repositories/reservas-repository"
import { addDays, addHours, endOfDay, format, isSameDay, setHours, startOfDay, startOfWeek, subHours } from "date-fns"
import { ptBR } from "date-fns/locale"
import ModalView from "@/components/formulario/ModalView.vue"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { phoneMaskOptions } from "@/lib/imaska"
import { vMaska } from "maska/vue"
import { Switch } from "@/components/ui/switch"

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
const selectedDate = ref<Date>(startOfDay(new Date()))
const selectedQuadra = ref<ArenaQuadras | null>(null)
const cartItems = ref<CartItem[]>([])
const showCart = ref(false)
const showModalConfirm = ref(false)
const userAcceptTerms = ref(false)
const dadosReserva = ref<Partial<SaveReservaPublico>>({
  enderecoCliente: "",
  nomeCliente: "",
  telefoneCliente: "",
  modoPagamento: "TOTAL"
})

const logo = computed(() => {
  const url = env.VITE_BACKEND_URL
  return url + '/' + conta.value?.profile + '?_t=' + Date.now()
})

const openModalPagamento = (tipo: "TOTAL" | "PARCIAL") => {
  if (!userAcceptTerms.value) return toast.error('Aceite os termos para finalizar a reserva!', { timeout: 5000, position: POSITION.BOTTOM_CENTER })
  dadosReserva.value.modoPagamento = tipo
  showModalConfirm.value = true
}

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

const quadrasFiltered = computed(() => {
  if (selectedQuadra.value) {
    return quadras.value?.filter(quadra => quadra.id === selectedQuadra.value?.id)
  }
  return quadras.value
})

async function getHorariosDisponiveis(quadra: ArenaQuadras) {
  try {
    loading.value = true
    if (!contaId.value || !Number(contaId.value)) return toast.error('Erro com o ID da conta, recarregue a página!');
    const horarios = await ArenaReservasRepository.getHorariosPublicoReservar(
      Number(contaId.value),
      quadra.id!,
      format(setHours(selectedDate.value, 8), "yyyy-MM-dd'T'HH:mm:ss"),
      format(setHours(selectedDate.value, 22), "yyyy-MM-dd'T'HH:mm:ss")
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
    price: quadra.precoHora as number,
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
    if (!userAcceptTerms.value) {
      return toast.error('Aceite os termos para finalizar a reserva!', { timeout: 5000, position: POSITION.BOTTOM_CENTER })
    }
    if (!selectedQuadra.value?.aprovarSemPagamento) {
      if (!dadosReserva.value.nomeCliente || !dadosReserva.value.telefoneCliente) {
        return toast.error('Preencha o nome e telefone para finalizar a reserva e realizar o pagamento!', {
          timeout: 5000,
          position: POSITION.BOTTOM_CENTER
        })
      }
    }
    const payload: SaveReservaPublico[] = mergedCart.value.map((item) => ({
      quadraId: item.quadraId,
      contaId: Number(contaId.value),
      inicio: format(item.startTime, "yyyy-MM-dd'T'HH:mm:ss", { locale: ptBR }),
      fim: format(item.endTime, "yyyy-MM-dd'T'HH:mm:ss", { locale: ptBR }),
      modoPagamento: 'TOTAL',
      nomeCliente: dadosReserva.value.nomeCliente,
      telefoneCliente: dadosReserva.value.telefoneCliente,
      enderecoCliente: dadosReserva.value.enderecoCliente,
      observacoes: dadosReserva.value.observacoes
    }))
    await Promise.all(
      payload.map(item => ArenaReservasRepository.savePublico(item))
    )
    cartItems.value = []
    selectedQuadra.value = null
    toast.success('Reservas realizadas com sucesso!', {
      timeout: 5000,
      position: POSITION.BOTTOM_CENTER
    })
    showModalConfirm.value = false
    showCart.value = false
    userAcceptTerms.value = false
    dadosReserva.value = { nomeCliente: '', telefoneCliente: '', enderecoCliente: '', observacoes: '' }
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message ?? 'Erro ao reservar, tente novamente!')
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


const canBookingPayment = computed(() => {
  const quadra = selectedQuadra.value
  return quadra && quadra.aprovarSemPagamento
})

const cor = ref({
  primary: "#0f766e",
  secondary: "#134e4a",
})

watch(() => selectedDate.value, () => {
  if (selectedQuadra.value) {
    getHorariosDisponiveis(selectedQuadra.value)
  }
})

// início da semana reativo
const inicioSemana = computed(() =>
  startOfWeek(selectedDate.value, { weekStartsOn: 0 }) // domingo
)

// dias da semana reativo
const diasSemana = computed(() =>
  Array.from({ length: 7 }, (_, i) => addDays(inicioSemana.value, i))
)

const disableHour = (hour: HorariosReservar) => {
  if (hour.reservada) return true
  const oneHourLater = addHours(hour.start, 1)
  const onrHoueBefore = subHours(hour.start, 1)

  const now = new Date()
  return (
    now > oneHourLater ||
    now < onrHoueBefore
  )
}

function changeWeek(type: "prev" | "next") {
  selectedDate.value = type === "prev"
    ? addDays(selectedDate.value, -1)
    : addDays(selectedDate.value, 1)
}
</script>

<template>
  <div class="min-h-screen p-4 relative select-none" :style="{
    backgroundImage: `linear-gradient(135deg, ${cor.primary} 0%, ${cor.secondary} 100%)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }">
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
          class="bg-primary border hover:bg-primary/90 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg relative">
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
          <CardTitle class="flex items-center justify-between space-x-2 font-normal">
            <div class="flex items-center space-x-2">
              <MapPin class="h-5 w-5" />
              <span>Escolha a Quadra</span>
            </div>
            <Button v-if="selectedQuadra" @click="selectedQuadra = null" class="text-xs text-white rounded-lg"
              size="xs">Trocar
              quadra</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-3">
            <div v-for="quadra in quadrasFiltered" :key="quadra.id" @click="getHorariosDisponiveis(quadra)"
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
                    {{ formatCurrencyBR(quadra.precoHora || 0) }}
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
          <CardTitle class="flex items-center space-x-2 font-normal justify-between">
            <div class="flex items-center space-x-2">
              <Calendar class="h-5 w-5" />
              <span>Escolha a Data</span>
            </div>
            <div class="flex items-center space-x-2 rounded-lg justify-between">
              <ArrowBigLeft class="cursor-pointer p-2" :size="35" @click="changeWeek('prev')" />
              <div class="flex flex-col items-center">
                <h1 class="text-xs">{{ format(selectedDate, "dd/MM/yyyy") }}</h1>
              </div>
              <ArrowBigRight class="cursor-pointer p-2" :size="35" @click="changeWeek('next')" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <!-- <Calendarpicker v-model="selectedDate" /> -->
          <div class="grid grid-cols-7 gap-2">
            <div v-for="row in diasSemana" :key="row.toISOString()" @click="selectedDate = row"
              class="border rounded-xl p-2 text-xs text-center cursor-pointer shadow-md hover:shadow-none"
              :class="isSameDay(selectedDate, row) ? 'bg-primary text-white shadow-none' : ''">
              <div>{{ formatToUpperCase(format(row, "EEEEEE dd/MM", { locale: ptBR })) }}</div>
            </div>
          </div>
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
              <Check class="h-4 w-4" v-if="isTimeSlotInCart(selectedQuadra.id!, selectedDate, hora.start)" />
              <CheckCheck class="h-4 w-4" v-if="hora.reservada" />
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
            <h2 class="text-xl font-bold">

              <ShoppingCart class="h-7 w-7 inline-flex" :stroke-width="2.5" /> Carrinho
            </h2>
            <p>Horários: {{ cartItems.length }}</p>
          </div>
          <div v-if="!cartItems.length">
            <p class="text-muted-foreground flex flex-col items-center justify-center">
              <Clock class="h-14 w-14" />
              Nenhum horário selecionado.
            </p>
          </div>
          <div v-for="(item, index) in cartItems" :key="index" class="flex justify-between items-center border-b py-2">
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

            <div class="flex flex-col gap-1" v-if="canBookingPayment">
              <p class="text-xs text-muted-foreground border bg-muted/40 p-2 rounded-md">
                As reservas devem ser pagas em até <span class="font-semibold">30 minutos</span> antes do horário
                marcado
                para evitar cancelamentos, sobre
                devolução de valores em caso de não comparecimento,
                informar com até <span class="font-semibold">1 hora de antecedência</span>, após isso, a empresa não tem
                obrigação legal de devolução.
              </p>
              <Label for="canBookingWithoutPayment"
                class="text-xs cursor-pointer border flex items-center justify-between my-2 p-2 rounded-md" :class="{
                  'bg-muted/40 text-muted-foreground': !userAcceptTerms,
                  'bg-success/20 text-dark': userAcceptTerms
                }">
                Confirmo que li e aceito os termos acima
                <Switch v-model="userAcceptTerms" id="canBookingWithoutPayment" class="float-right" />
              </Label>
            </div>

            <div class="grid grid-cols-2 gap-2" v-if="canBookingPayment">
              <Button class="flex-1 text-white text-md col-span-2 md:col-span-1"
                @click="openModalPagamento('TOTAL')">Pagar 100%</Button>
              <Button variant="outline" @click="openModalPagamento('PARCIAL')"
                class="flex-1 text-md col-span-2 md:col-span-1">
                Reservar (50%) - {{ formatCurrencyBR((totalPrice / 2)) }}
              </Button>
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
      <form class="flex flex-col px-4 gap-2">
        <div>
          <Label for="name">Nome completo <span class="text-red-500">*</span></Label>
          <Input id="name" v-model="dadosReserva.nomeCliente" placeholder="Nome completo" />
        </div>
        <div>
          <Label for="phone">Telefone <span class="text-red-500">*</span></Label>
          <Input id="phone" v-model="dadosReserva.telefoneCliente" v-maska="phoneMaskOptions" placeholder="Telefone" />
        </div>
        <div>
          <Label for="email">E-mail</Label>
          <Input id="email" v-model="dadosReserva.enderecoCliente" placeholder="E-mail" />
        </div>
        <div>
          <Label for="formaPagamento">Forma de pagamento</Label>
          <div class="flex flex-col gap-2">
            <RadioGroup default-value="PIX" class="grid grid-cols-3">
              <Label for="option-one"
                class="flex items-center text-sm col-span-3 p-3 px-4 gap-2 bg-success/20 border rounded-lg cursor-pointer">
                <RadioGroupItem id="option-one" value="PIX" class="bg-white" />
                <i class="fa-brands fa-pix"></i>
                PIX
              </Label>
              <!-- <Label for="option-three"
                class="flex items-center text-sm p-3 px-4 gap-2 bg-body/70 border rounded-lg cursor-pointer">
                <RadioGroupItem id="option-three" value="BOLETO" class="bg-white" />
                <i class="fa-solid fa-file-invoice"></i>
                Boleto
              </Label>
              <Label for="option-two"
                class="flex items-center text-sm p-3 px-4 gap-2 bg-primary/20 border rounded-lg cursor-pointer">
                <RadioGroupItem id="option-two" value="LINK" class="bg-white" />
                <i class="fa-solid fa-link"></i>
                Link
              </Label> -->
            </RadioGroup>
          </div>
        </div>
        <Button class="mt-4 h-12 text-md text-white" type="button" @click="reservar" variant="default">
          <CircleDollarSign />
          Confirmar e pagar
        </Button>
      </form>
    </ModalView>
  </div>
</template>

<style scoped>
.hidden_scrollbar {
  overflow: auto !important;
  /* ou scroll, conforme sua necessidade */
  scrollbar-width: none !important;
  /* Firefox */
  -ms-overflow-style: none !important;
  /* IE e Edge antigo */
}
</style>
