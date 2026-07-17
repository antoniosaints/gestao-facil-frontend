<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-xl font-semibold">
          <LifeBuoy class="h-5 w-5" />
          Acessos de suporte
        </h1>
        <p class="text-sm text-muted-foreground">
          Todo acesso do CEO à conta de um assinante fica registrado aqui.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="search" class="pl-8" placeholder="Conta, e-mail ou motivo" />
        </div>
        <Button variant="outline" :disabled="loading" @click="carregar">
          <RefreshCcw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Loader class="h-6 w-6 animate-spin text-primary" />
    </div>

    <Empty v-else-if="!registros.length" class="py-12">
      <EmptyHeader>
        <EmptyMedia>
          <LifeBuoy class="h-8 w-8 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>Nenhum acesso registrado</EmptyTitle>
        <EmptyDescription>
          Os acessos de suporte às contas dos assinantes aparecerão aqui.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

    <div v-else class="space-y-3">
      <div v-for="registro in registros" :key="registro.id"
        class="rounded-lg border p-4"
        :class="registro.ativa ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : ''">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium">{{ registro.contaNome }}</span>
              <span class="text-xs text-muted-foreground">#{{ registro.contaId }}</span>
              <span v-if="registro.ativa"
                class="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-amber-950">
                Em andamento
              </span>
              <span v-else-if="registro.encerradoPor === 'REVOGADO'"
                class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                Revogado
              </span>
              <span v-else
                class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Encerrado
              </span>
            </div>
            <p class="text-sm">
              <strong>{{ registro.superAdminNome }}</strong>
              <span class="text-muted-foreground"> ({{ registro.superAdminEmail }}) acessou como </span>
              {{ registro.usuarioAlvoEmail }}
            </p>
            <p class="text-sm text-muted-foreground">Motivo: {{ registro.motivo }}</p>
            <p class="text-xs text-muted-foreground">
              {{ formatDateToPtBR(registro.iniciadoEm, true) }}
              <span v-if="registro.encerradoEm"> — encerrado em {{ formatDateToPtBR(registro.encerradoEm, true) }}</span>
              <span v-else> — expira em {{ formatDateToPtBR(registro.expiraEm, true) }}</span>
              <span v-if="registro.ip"> · IP {{ registro.ip }}</span>
            </p>
          </div>
          <Button v-if="registro.ativa" variant="destructive" size="sm" :disabled="revogando === registro.id"
            @click="revogar(registro)">
            <Loader v-if="revogando === registro.id" class="h-4 w-4 animate-spin" />
            <Ban v-else class="h-4 w-4" />
            Revogar
          </Button>
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
        <span class="text-sm text-muted-foreground">
          Página {{ currentPage }} de {{ totalPages }} — {{ total }} registro(s)
        </span>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" :disabled="currentPage <= 1" @click="currentPage--">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" :disabled="currentPage >= totalPages" @click="currentPage++">
            <ArrowRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { ArrowLeft, ArrowRight, Ban, LifeBuoy, Loader, RefreshCcw, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useConfirm } from '@/composables/useConfirm'
import { type AcessoSuporteLog, ContaRepository } from '@/repositories/conta-repository'
import { formatDateToPtBR } from '@/utils/formatters'

const toast = useToast()
const confirm = useConfirm()

const registros = ref<AcessoSuporteLog[]>([])
const loading = ref(false)
const revogando = ref<number | null>(null)
const search = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)

let searchTimer: ReturnType<typeof setTimeout> | undefined

async function carregar() {
  try {
    loading.value = true
    const res = await ContaRepository.listarAcessosSuporte({
      page: currentPage.value,
      pageSize: 10,
      search: search.value.trim() || undefined,
    })
    registros.value = res.data
    totalPages.value = res.totalPages || 1
    total.value = res.total
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao carregar os acessos de suporte')
  } finally {
    loading.value = false
  }
}

async function revogar(registro: AcessoSuporteLog) {
  const ok = await confirm.confirm({
    title: 'Revogar acesso',
    message: `Encerrar agora a sessão de ${registro.superAdminNome} na conta "${registro.contaNome}"? A sessão cai na próxima requisição.`,
    confirmText: 'Revogar',
    colorButton: 'danger',
  })
  if (!ok) return

  try {
    revogando.value = registro.id
    const res = await ContaRepository.revogarAcessoSuporte(registro.id)
    toast.success(res?.message || 'Sessão revogada')
    await carregar()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao revogar a sessão')
  } finally {
    revogando.value = null
  }
}

watch(currentPage, carregar)
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    carregar()
  }, 400)
})

onMounted(carregar)
</script>
