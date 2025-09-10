<template>
    <div v-if="show"
        class="flex items-center justify-between space-x-4 relative rounded-lg w-full border-2 border-warning py-2 px-4 mb-2">
        <div class="absolute left-0 rounded-l-sm w-3 h-full bg-warning"></div>
        <div class="flex flex-col">
            <h2 class="font-semibold flex items-center">
                <Sparkles class="mr-2 w-4 h-4" /> {{ infos.title }}
            </h2>
            <p class="text-sm text-muted-foreground">{{ infos.subtitle }}</p>
        </div>
        <div>
            <Button variant="destructive" class="mr-2" @click="dismiss">Ignorar</Button>
            <RouterLink to="/assinatura/resumo" as-child>
                <Button variant="default" class="text-white">Pagar</Button>
            </RouterLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Button } from '../ui/button';
import { useUiStore } from '@/stores/ui/uiStore';

const store = useUiStore()
const showToast = ref<boolean>(localStorage.getItem('gestao_facil:showToast') === 'true' ? true : false)

if (store.diasParaVencer > 3 && !showToast.value) {
    localStorage.setItem('gestao_facil:showToast', 'true')
    showToast.value = true
}
const show = computed(() => store.diasParaVencer <= 3 && showToast.value)

function dismiss() {
    localStorage.setItem('gestao_facil:showToast', 'false')
    showToast.value = false
}

const dias = computed(() => {
    if (Math.floor(store.diasParaVencer) === 1) return 'dia'
    return 'dias'
})

const label = computed(() => {
    if (Math.floor(store.diasParaVencer) < 0) return 'Assinatura expirada'
    return `Assinatura vence em ${Math.floor(store.diasParaVencer)} ${dias.value}`
})

const infos = ref({
    title: 'Gestão Fácil - Assinatura',
    subtitle: `${label.value}. Renove para manter sua assinatura ativa e ter acesso a todos os recursos da plataforma.`,
})
</script>