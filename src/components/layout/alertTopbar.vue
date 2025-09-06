<template>
    <div v-if="show"
        class="flex items-center justify-between space-x-4 relative rounded-md w-full border-2 border-primary py-2 px-4 mb-2">
        <div class="absolute left-0 rounded-l-sm w-3 h-full bg-primary"></div>
        <div class="flex flex-col">
            <h2 class="font-semibold flex items-center">
                <Sparkles class="mr-2 w-4 h-4" /> {{ infos.title }}
            </h2>
            <p class="text-sm text-muted-foreground">{{ infos.subtitle }}</p>
        </div>
        <Button variant="default" class="text-white">Pagar</Button>
    </div>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';
import { ref } from 'vue';
import { Button } from '../ui/button';

const show = ref(false);

const infos = ref({
    title: 'Gestão Fácil - Assinatura',
    subtitle: 'Realize o pagamento do seu plano e comece a usar o Gestão Fácil ERP',
})
</script>