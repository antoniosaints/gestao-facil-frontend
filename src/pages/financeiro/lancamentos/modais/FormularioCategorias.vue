<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LancamentosRepository } from '@/repositories/lancamento-repository';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast()
const open = ref(false)
const nome = ref('')

async function submit() {
    try {
        await LancamentosRepository.criarCategoria({
            nome: nome.value,
        })
        toast.success("Registro salvo com sucesso!")
        nome.value = ''
        open.value = false
    } catch (error) {
        console.log(error)
        toast.error("Erro ao salvar o registro")
    }
}
</script>

<template>
    <div class="p-0 m-0 gap-0 inline-flex">
        <a @click="open = true">
            <slot />
        </a>
        <ModalView v-model:open="open" title="Categorias financeiras" description="Preencha os dados da nova categoria"
            size="md">
            <form @submit.prevent="submit">
                <div class="grid grid-cols-2 gap-6 px-4">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium mb-1">
                            Nome da categoria *
                        </label>
                        <Input v-model="nome" type="text" placeholder="Ex: Vendas, Compras ...." />
                    </div>
                    <div class="col-span-2 flex gap-2 justify-end">
                        <Button type="button" @click="open = false" variant="secondary">
                            Fechar
                        </Button>
                        <Button class="bg-blue-500 dark:bg-blue-900 hover:bg-blue-700 dark:text-white">
                            Registrar
                        </Button>
                    </div>
                </div>
            </form>
        </ModalView>
    </div>
</template>