<template>
    <div v-if="show"
        class="flex items-center justify-between space-x-4 relative rounded-lg w-full border-2 border-warning py-2 px-4 mb-2">
        <div class="absolute left-0 rounded-l-sm w-3 h-full bg-warning"></div>
        <div class="flex flex-col">
            <h2 class="font-semibold flex items-center">
                <CircleDollarSign class="mr-2 w-4 h-4" /> Gestão Fácil - Assinatura
            </h2>
            <p class="text-sm text-muted-foreground">
                {{ label }}. Renove para manter sua assinatura ativa e ter acesso a todos os recursos da plataforma.
            </p>
        </div>
        <div class="flex items-center">
            <Button variant="outline" class="mr-2" @click="dismiss">
                <X />
            </Button>
            <RouterLink to="/assinatura/resumo" as-child>
                <Button variant="default" class="text-white">
                    <CircleDollarSign /> Pagar
                </Button>
            </RouterLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { CircleDollarSign, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { Button } from '../ui/button';
import { useUiStore } from '@/stores/ui/uiStore';

const store = useUiStore()
const showToast = ref<boolean>(localStorage.getItem('gestao_facil:showToast') === 'true')

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
    if (store.diasParaVencer < 0) return 'Assinatura expirada'
    return `Assinatura vence em ${Math.floor(store.diasParaVencer)} ${dias.value}`
})
</script>
