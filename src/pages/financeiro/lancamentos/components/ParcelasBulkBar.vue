<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, CircleDollarSign, MoreVertical, Trash2, Undo2, X } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrencyBR } from '@/utils/formatters'
import { useUiStore } from '@/stores/ui/uiStore'

const props = defineProps<{
  total: number
  valor: number
  pendentes: number
  pagas: number
  semCobranca: number
  processando?: boolean
}>()

const emit = defineEmits<{
  efetivar: []
  cobrar: []
  estornar: []
  excluir: []
  limpar: []
}>()

const uiStore = useUiStore()

const podeEfetivar = computed(() => !props.processando && props.pendentes > 0)
const podeCobrar = computed(() => !props.processando && uiStore.canCreateCharge && props.semCobranca > 0)
const podeEstornar = computed(() => !props.processando && props.pagas > 0)
const podeExcluir = computed(() => !props.processando && props.pendentes > 0)
</script>

<template>
  <div
    v-if="total > 0"
    class="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2 backdrop-blur"
  >
    <span class="text-sm font-medium text-foreground">
      {{ total }} parcela(s) selecionada(s)
      <span class="text-muted-foreground">• {{ formatCurrencyBR(valor) }}</span>
    </span>

    <div v-if="!uiStore.isMobile" class="ml-auto flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        class="text-white"
        :disabled="!podeEfetivar"
        v-tooltip="`${pendentes} parcela(s) pendente(s) selecionada(s)`"
        @click="emit('efetivar')"
      >
        <CheckCircle2 class="h-4 w-4" /> Efetivar
      </Button>
      <Button
        v-if="uiStore.canCreateCharge"
        size="sm"
        class="bg-success text-white hover:bg-success/80"
        :disabled="!podeCobrar"
        v-tooltip="`${semCobranca} parcela(s) pendente(s) sem cobrança`"
        @click="emit('cobrar')"
      >
        <CircleDollarSign class="h-4 w-4" /> Gerar cobrança
      </Button>
      <Button
        size="sm"
        variant="outline"
        :disabled="!podeEstornar"
        v-tooltip="`${pagas} parcela(s) efetivada(s) selecionada(s)`"
        @click="emit('estornar')"
      >
        <Undo2 class="h-4 w-4" /> Estornar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        :disabled="!podeExcluir"
        v-tooltip="`${pendentes} parcela(s) pendente(s) selecionada(s)`"
        @click="emit('excluir')"
      >
        <Trash2 class="h-4 w-4" /> Excluir
      </Button>
      <Button size="sm" variant="ghost" class="text-muted-foreground" @click="emit('limpar')">
        <X class="h-4 w-4" /> Limpar
      </Button>
    </div>

    <div v-else class="ml-auto flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button size="sm" variant="outline" :disabled="processando">
            <MoreVertical class="h-4 w-4" /> Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-52">
          <DropdownMenuItem :disabled="!podeEfetivar" @click="emit('efetivar')">
            <CheckCircle2 class="mr-2 h-4 w-4" /> Efetivar ({{ pendentes }})
          </DropdownMenuItem>
          <DropdownMenuItem v-if="uiStore.canCreateCharge" :disabled="!podeCobrar" @click="emit('cobrar')">
            <CircleDollarSign class="mr-2 h-4 w-4" /> Gerar cobrança ({{ semCobranca }})
          </DropdownMenuItem>
          <DropdownMenuItem :disabled="!podeEstornar" @click="emit('estornar')">
            <Undo2 class="mr-2 h-4 w-4" /> Estornar ({{ pagas }})
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-red-600 focus:text-red-600"
            :disabled="!podeExcluir"
            @click="emit('excluir')"
          >
            <Trash2 class="mr-2 h-4 w-4" /> Excluir ({{ pendentes }})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" variant="ghost" class="text-muted-foreground" @click="emit('limpar')">
        <X class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
