<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import ModalView from '@/components/formulario/ModalView.vue';
import Button from '@/components/ui/button/Button.vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVendasStore } from '@/stores/vendas/useVenda';
import { Funnel } from 'lucide-vue-next';
import { inject, ref } from 'vue';
const open = inject('openModalFiltroVendas', ref(false))
const store = useVendasStore()
const periodo = ref<Date[] | null>(null)
const status = ref<string | null>(null)

function aplicarFiltro() {
    const formated: { inicio: string | null; fim: string | null } = {
        inicio: null,
        fim: null,
    }

    if (periodo.value) {
        formated.inicio = periodo.value![0].toISOString().split('T')[0]
        formated.fim = periodo.value![1].toISOString().split('T')[0]
    }

    store.filters.periodo = formated
    store.filters.status = status.value as string
    open.value = false
}

function limparFiltro() {
    store.filters.periodo = { inicio: null, fim: null }
    store.filters.status = ''
    status.value = null
    open.value = false
}
</script>

<template>
    <ModalView v-model:open="open" title="Filtrar vendas" size="lg"
        description="Preencha os dados para filtrar as vendas">
        <div class="flex flex-col px-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-6">
                    <label class="block text-sm mb-1">Período de vendas <span class="text-red-500">*</span></label>
                    <Calendarpicker v-model="periodo" placeholder="Período" :range="true" :teleport="true" />
                </div>
                <div class="md:col-span-6">
                    <label class="block text-sm mb-1">Status <span class="text-red-500">*</span></label>
                    <Select v-model="status" default-value="ORCAMENTO">
                        <SelectTrigger class="w-full bg-card dark:bg-card-dark">
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ORCAMENTO">
                                Orçamento
                            </SelectItem>
                            <SelectItem value="ANDAMENTO">
                                Em andamento
                            </SelectItem>
                            <SelectItem value="FINALIZADO">
                                Finalizado
                            </SelectItem>
                            <SelectItem value="PENDENTE">
                                Pendente
                            </SelectItem>
                            <SelectItem value="CANCELADO">
                                Cancelado
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div class="md:col-span-12 text-end flex justify-end">
                    <Button variant="outline" class="text-white mr-2" @click="limparFiltro">
                        Limpar
                    </Button>
                    <Button class="text-white" @click="aplicarFiltro">
                        <Funnel />
                        Filtrar
                    </Button>
                </div>
            </div>
        </div>
    </ModalView>
</template>