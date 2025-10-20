<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ServicoRepository } from '@/repositories/servico-repository';
import { useServicoStore } from '@/stores/servicos/useServicos';
import { useToast } from 'vue-toastification';
import { vMaska } from 'maska/vue';
import { moneyMaskOptions } from '@/lib/imaska';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const store = useServicoStore();
const toast = useToast();
async function submit() {
    try {
        const response = await ServicoRepository.saveOrUpdate({
            nome: store.form.nome,
            preco: String(store.form.preco).replace(',', '.'),
            status: store.form.status,
            descricao: store.form.descricao,
            id: store.form.id
        })
        toast.success('Registrado com sucesso')
        store.updateTable()
        store.reset()
        store.openModal = false
    } catch (error) {
        console.log(error);
        toast.error('Erro ao salvar o servico, tente novamente.')
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModal" size="lg" title="Formulario de servicos"
        description="Preencha os campos abaixo">
        <form @submit.prevent="submit" class="flex flex-col px-4">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full grid grid-cols-2 gap-4">
                <div class="w-full gap-2 flex flex-col col-span-2">
                    <Label for="nome">Nome</Label>
                    <Input id="nome" required v-model="store.form.nome" placeholder="Nome" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="preco">Preço</Label>
                    <Input id="preco" type="text" v-maska="moneyMaskOptions" v-model="store.form.preco"
                        placeholder="Preço" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="entrada">
                        Status
                    </Label>
                    <div class="grid grid-cols-12 md:space-x-2 gap-2 items-center md:col-span-12">
                        <div class="col-span-12">
                            <label for="statusServico"
                                class="border bg-card border-border px-3 py-[8px] rounded-lg flex items-center cursor-pointer">
                                <div class="flex items-center">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <Switch id="statusServico" v-model:model-value="store.form.status" />
                                        <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                            {{ store.form.status ? 'Ativo' : 'Inativo' }}
                                        </span>
                                    </label>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="w-full gap-2 flex flex-col col-span-2">
                    <Label for="descricao">Descrição</Label>
                    <Textarea id="descricao" v-model="store.form.descricao" placeholder="Descrição"></Textarea>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModal = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>