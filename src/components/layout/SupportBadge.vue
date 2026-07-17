<template>
    <Popover v-if="info">
        <PopoverTrigger as-child>
            <button type="button"
                class="flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-500 px-2.5 py-1 text-xs font-medium text-amber-950 transition hover:bg-amber-400"
                title="Sessão de suporte ativa — clique para detalhes">
                <LifeBuoy class="h-3.5 w-3.5 shrink-0" />
                <span>Suporte</span>
                <span class="font-mono tabular-nums">{{ restante }}</span>
            </button>
        </PopoverTrigger>

        <PopoverContent align="end" class="w-80 space-y-3">
            <div class="space-y-1">
                <p class="flex items-center gap-1.5 text-sm font-semibold">
                    <LifeBuoy class="h-4 w-4 shrink-0 text-amber-600" />
                    Sessão de suporte ativa
                </p>
                <p class="text-xs text-muted-foreground">
                    Você não está na sua conta. As ações feitas aqui valem para o assinante e ficam registradas na
                    auditoria.
                </p>
            </div>

            <dl class="space-y-1.5 text-sm">
                <div class="flex justify-between gap-2">
                    <dt class="text-muted-foreground">Conta</dt>
                    <dd class="truncate font-medium">{{ info.conta.nome }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                    <dt class="text-muted-foreground">Logado como</dt>
                    <dd class="truncate">{{ info.usuarioAlvo.email }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                    <dt class="text-muted-foreground">Expira em</dt>
                    <dd class="font-mono tabular-nums">{{ restante }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                    <dt class="text-muted-foreground">Término</dt>
                    <dd>{{ formatDateToPtBR(info.expiraEm, true) }}</dd>
                </div>
            </dl>

            <Button class="w-full" variant="destructive" size="sm" :disabled="saindo" @click="sair">
                <Loader v-if="saindo" class="h-4 w-4 animate-spin" />
                <LogOut v-else class="h-4 w-4" />
                {{ saindo ? 'Saindo...' : 'Sair do suporte' }}
            </Button>
        </PopoverContent>
    </Popover>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { LifeBuoy, Loader, LogOut } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ContaRepository } from '@/repositories/conta-repository'
import { exitSupport, getSupportInfo } from '@/utils/supportSession'
import { formatDateToPtBR } from '@/utils/formatters'

const info = ref(getSupportInfo())
const agora = ref(Date.now())
const saindo = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

const restante = computed(() => {
    if (!info.value) return ''
    const ms = new Date(info.value.expiraEm).getTime() - agora.value
    if (ms <= 0) return 'expirando'
    const min = Math.floor(ms / 60000)
    const seg = Math.floor((ms % 60000) / 1000)
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`
})

onMounted(() => {
    timer = setInterval(() => (agora.value = Date.now()), 1000)
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})

async function sair() {
    saindo.value = true
    try {
        // Best-effort: se falhar, a sessão expira sozinha e o token do CEO é
        // restaurado do mesmo jeito — o importante é não prender o CEO aqui.
        await ContaRepository.encerrarSuporte()
    } catch (error) {
        console.log(error)
    } finally {
        exitSupport()
        window.location.href = '/admin/assinantes'
    }
}
</script>
