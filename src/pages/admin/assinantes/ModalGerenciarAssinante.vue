<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ContaRepository, type ContaAssinanteAdmin } from '@/repositories/conta-repository'
import { formatDateToPtBR } from '@/utils/formatters'
import { Ban, CalendarClock, ShieldCheck, UserCog } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

const props = defineProps<{
  conta: ContaAssinanteAdmin | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()
const loading = ref(false)
const status = ref<'ATIVO' | 'INATIVO' | 'BLOQUEADO'>('ATIVO')
const vencimento = ref<Date | null>(new Date())

const title = computed(() =>
  props.conta ? `Gerenciar ${props.conta.nome}` : 'Gerenciar conta',
)

watch(
  () => props.conta,
  (value) => {
    if (!value) return
    status.value = (value.status as 'ATIVO' | 'INATIVO' | 'BLOQUEADO') || 'ATIVO'
    vencimento.value = value.vencimento ? new Date(value.vencimento) : new Date()
  },
  { immediate: true },
)

function aplicarStatus(nextStatus: 'ATIVO' | 'INATIVO' | 'BLOQUEADO') {
  status.value = nextStatus
}

async function submit() {
  if (!props.conta?.id) return

  if (!vencimento.value || Number.isNaN(vencimento.value.getTime())) {
    toast.error('Selecione uma data de vencimento válida')
    return
  }

  try {
    loading.value = true
    await ContaRepository.gerenciarAssinante(props.conta.id, {
      status: status.value,
      vencimento: vencimento.value.toISOString(),
    })
    toast.success('Conta atualizada com sucesso')
    open.value = false
    emit('saved')
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar a conta')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    :title="title"
    description="Ajuste manualmente o status e o vencimento da conta selecionada."
    size="lg"
    :icon="UserCog"
  >
    <form @submit.prevent="submit" class="grid gap-4 px-4">
      <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
        <CardContent class="grid gap-3 p-4 md:grid-cols-2">
          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Conta</div>
            <div class="mt-1 text-sm font-medium text-foreground">{{ conta?.nome || '-' }}</div>
            <div class="mt-1 text-xs text-muted-foreground">{{ conta?.email || '-' }}</div>
          </div>

          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Vencimento atual</div>
            <div class="mt-1 text-sm font-medium text-foreground">
              {{ conta?.vencimento ? formatDateToPtBR(conta.vencimento) : '-' }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">
              Status atual: {{ conta?.status || '-' }}
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardContent class="space-y-4 p-4">
            <div class="space-y-2">
              <Label>Status da conta</Label>
              <Select v-model="status">
                <SelectTrigger class="w-full bg-background/80">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Vencimento</Label>
              <div class="rounded-lg">
                <Calendarpicker v-model="vencimento" :teleport="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardContent class="space-y-3 p-4">
            <div>
              <div class="text-sm font-medium text-foreground">Ações rápidas</div>
              <div class="text-xs text-muted-foreground">
                Use um atalho para preparar o status antes de salvar.
              </div>
            </div>

            <Button type="button" class="w-full justify-start gap-2 text-white" @click="aplicarStatus('ATIVO')">
              <ShieldCheck class="h-4 w-4" />
              Liberar manualmente
            </Button>

            <Button type="button" variant="outline" class="w-full justify-start gap-2" @click="aplicarStatus('INATIVO')">
              <CalendarClock class="h-4 w-4" />
              Desativar conta
            </Button>

            <Button type="button" variant="destructive" class="w-full justify-start gap-2" @click="aplicarStatus('BLOQUEADO')">
              <Ban class="h-4 w-4" />
              Bloquear conta
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div class="flex justify-end gap-2 pb-1">
        <Button type="button" variant="secondary" :disabled="loading" @click="open = false">Fechar</Button>
        <Button type="submit" class="text-white" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar controle' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>
