<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ContaRepository, type FaturaContaAdmin } from '@/repositories/conta-repository'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import { CalendarClock, CircleDollarSign, FileCog } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

const props = defineProps<{
  fatura: FaturaContaAdmin | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()
const loading = ref(false)
const status = ref<'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO'>('PENDENTE')
const vencimento = ref<Date | null>(new Date())
const descricao = ref('')

const title = computed(() => (props.fatura ? `Gerenciar ${props.fatura.Uid}` : 'Gerenciar fatura'))

watch(
  () => props.fatura,
  (value) => {
    if (!value) return
    status.value = value.status
    vencimento.value = value.vencimento ? new Date(value.vencimento) : new Date()
    descricao.value = value.descricao || ''
  },
  { immediate: true },
)

async function submit() {
  if (!props.fatura?.id) return

  if (!vencimento.value || Number.isNaN(vencimento.value.getTime())) {
    toast.error('Selecione um vencimento válido')
    return
  }

  try {
    loading.value = true
    await ContaRepository.gerenciarFaturaAdmin(props.fatura.id, {
      status: status.value,
      vencimento: vencimento.value.toISOString(),
      descricao: descricao.value.trim(),
    })
    toast.success('Fatura atualizada com sucesso')
    open.value = false
    emit('saved')
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar a fatura')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    :title="title"
    description="Acompanhe a cobranca e ajuste manualmente o status quando necessario."
    size="lg"
    :icon="FileCog"
  >
    <form @submit.prevent="submit" class="grid gap-4 px-4">
      <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
        <CardContent class="grid gap-3 p-4 md:grid-cols-2">
          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Conta</div>
            <div class="mt-1 text-sm font-medium text-foreground">
              {{ fatura?.conta.nomeFantasia || fatura?.conta.nome || '-' }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">{{ fatura?.conta.email || '-' }}</div>
          </div>

          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Valor</div>
            <div class="mt-1 text-sm font-medium text-foreground">
              {{ formatCurrencyBR(fatura?.valor || 0) }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              Criada em {{ fatura?.criadoEm ? formatDateToPtBR(fatura.criadoEm) : '-' }}
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-2">
        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardContent class="space-y-4 p-4">
            <div class="space-y-2">
              <Label>Status da fatura</Label>
              <Select v-model="status">
                <SelectTrigger class="w-full bg-background/80">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="ATRASADO">Atrasado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Descricao</Label>
              <Input v-model="descricao" placeholder="Observacao administrativa da fatura" />
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardContent class="space-y-4 p-4">
            <div class="space-y-2">
              <Label>Vencimento</Label>
              <div class="rounded-lg border border-border/70 bg-background/80 px-3 py-2">
                <Calendarpicker v-model="vencimento" :teleport="true" />
              </div>
            </div>

            <div class="rounded-lg border border-border/70 bg-background/70 p-3 text-sm text-muted-foreground">
              Marcar como <strong class="text-foreground">Pago</strong> libera a conta.
              Marcar como <strong class="text-foreground">Atrasado</strong> bloqueia a conta.
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div class="flex justify-between gap-2 pb-1">
        <a
          v-if="fatura?.urlPagamento"
          :href="fatura.urlPagamento"
          target="_blank"
          rel="noreferrer"
          class="inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          <CircleDollarSign class="h-4 w-4" />
          Abrir cobranca
        </a>
        <div class="ml-auto flex gap-2">
          <Button type="button" variant="secondary" :disabled="loading" @click="open = false">Fechar</Button>
          <Button type="submit" class="text-white" :disabled="loading">
            {{ loading ? 'Salvando...' : 'Salvar fatura' }}
          </Button>
        </div>
      </div>
    </form>
  </ModalView>
</template>
