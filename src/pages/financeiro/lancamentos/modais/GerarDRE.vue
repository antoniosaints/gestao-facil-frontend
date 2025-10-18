<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos';
import { endOfMonth, startOfMonth } from 'date-fns';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const store = useLancamentosStore()
const toast = useToast()
const filtroPeriodo = ref([startOfMonth(new Date()), endOfMonth(new Date())])

async function generateDre(type: "01" | "02") {
    try {
        if (filtroPeriodo.value === null) {
            return toast.error('Selecione um periodo!')
        }
        if (type === '01') {
            await LancamentosRepository.gerarDREPDF(filtroPeriodo.value[0].toDateString(), filtroPeriodo.value[1].toDateString())
        }
        if (type === '02') {
            await LancamentosRepository.gerarDREPDF2(filtroPeriodo.value[0].toDateString(), filtroPeriodo.value[1].toDateString())
        }

        toast.success('DRE gerado com sucesso!')
    } catch (error) {
        console.log(error);
        toast.error('Erro ao gerar o DRE, tente novamente!')
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModalDre" title="Gerar DRE" description="Exporte um PDF com o DRE" size="md">
        <div class="grid grid-cols-2 gap-6 px-4">
            <Calendarpicker class="col-span-2" v-model="filtroPeriodo" :teleport="true" :range="true" />
            <div class="col-span-2 flex gap-2 justify-end">
                <Button variant="secondary" @click="store.openModalDre = false">
                    Fechar
                </Button>
                <Button @click="generateDre('01')"
                    class="bg-orange-500 dark:bg-orange-900 hover:bg-orange-700 dark:text-white">
                    <i class="fa-solid fa-file-pdf"></i>
                    DRE 01
                </Button>
                <Button @click="generateDre('02')"
                    class="bg-orange-500 dark:bg-orange-900 hover:bg-orange-700 dark:text-white">
                    <i class="fa-solid fa-file-pdf"></i>
                    DRE 02
                </Button>
            </div>
        </div>
    </ModalView>
</template>