<script lang="ts" setup>
import { vMaska } from "maska/vue"
import { Button } from "@/components/ui/button"
import { useProdutoStore } from "@/stores/produtos/useProduto"
import { useToast } from "vue-toastification"
import { moneyMaskOptions } from "@/lib/imaska"
import { Switch } from "@/components/ui/switch"
import ModalView from "@/components/formulario/ModalView.vue"
import { computed } from "vue"
import { ProdutoRepository } from "@/repositories/produto-repository"

const store = useProdutoStore()
const toast = useToast()

async function submit() {
    try {
        if (store.form.id) {
            await ProdutoRepository.update(store.form, store.form.id)
            toast.success('Produto atualizado com sucesso')
        } else {
            await ProdutoRepository.save(store.form)
            toast.success('Produto salvo com sucesso')
        }
        store.reset()
        store.updateTable()
        store.openModal = false
    } catch (error: any) {
        console.log(error)
        const errors = error?.response?.data?.data ? error?.response?.data?.data.map((item: any) => item.message).join('\n') : "Ocorreu um erro ao salvar o produto"
        toast.error(errors)
    }
}

const title = computed(() => store.form.id ? 'Editar produto' : 'Novo produto')

</script>

<template>
    <ModalView v-model:open="store.openModal" :title="title" description="Preencha os campos abaixo">
        <form @submit.prevent="submit" class="grid items-start gap-4 px-4">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full space-y-2">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <!-- Nome -->
                    <div class="md:col-span-12 lg:col-span-8">
                        <label for="nome" class="block text-sm font-medium mb-1">
                            Produto <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="nome" name="nome" required placeholder="Nome do produto"
                            v-model="store.form.nome" class="w-full p-2 rounded-md border bg-card border-border" />
                    </div>

                    <!-- Permitir Entrada e Saída de Estoque -->
                    <div class="md:col-span-12 lg:col-span-4 grid grid-cols-1 md:grid-cols-12 items-center">
                        <label for="entrada" class="block text-sm font-medium mb-0 md:col-span-12">
                            Permitir Controle
                        </label>
                        <div class="grid grid-cols-12 space-x-2 mt-1 items-center md:col-span-12">
                            <div class="col-span-6">
                                <div class="border bg-card border-border px-3 py-2.5 rounded-md">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <Switch v-model:model-value="store.form.entradas" />
                                            <span
                                                class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Entradas</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="col-span-6">
                                <div class="border bg-card border-border px-3 py-2.5 rounded-md">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <Switch v-model:model-value="store.form.saidas" />
                                            <span
                                                class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Saídas</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <!-- Código -->
                    <div class="md:col-span-4">
                        <label for="codigo" class="block text-sm font-medium mb-1">Código</label>
                        <input v-model="store.form.codigo" type="text" id="codigo" name="codigo"
                            placeholder="Código do produto"
                            class="w-full p-2 rounded-md border bg-card border-border" />
                    </div>

                    <!-- Preço -->
                    <div class="md:col-span-4">
                        <label for="precoProdutoCompra" class="block text-sm font-medium mb-1">
                            Preço Compra
                        </label>
                        <input v-model="store.form.precoCompra" v-maska="moneyMaskOptions" type="text"
                            ref="precoProdutoCompra" name="precoCompra" placeholder="Ex: 79,90"
                            class="w-full p-2 money_mask rounded-md border bg-card border-border" />
                    </div>

                    <div class="md:col-span-4">
                        <label for="precoProdutoVenda" class="block text-sm font-medium mb-1">
                            Preço <span class="text-red-500">*</span>
                        </label>
                        <input v-model="store.form.preco" v-maska="moneyMaskOptions" type="text" id="precoProdutoVenda"
                            name="preco" required placeholder="Ex: 99,90"
                            class="w-full p-2 money_mask rounded-md border bg-card border-border" />
                    </div>

                    <!-- Estoque Inicial -->
                    <div class="md:col-span-4">
                        <label for="estoque" class="block text-sm font-medium mb-1">
                            Estoque Inicial <span class="text-red-500">*</span>
                        </label>
                        <input v-model="store.form.estoque" :readonly="store.form.id != null" type="number" id="estoque"
                            name="estoque" required placeholder="Ex: 100"
                            class="w-full p-2 rounded-md border bg-card border-border read-only:bg-body read-only:cursor-not-allowed" />
                    </div>

                    <!-- Estoque Mínimo -->
                    <div class="md:col-span-4">
                        <label for="minimo" class="block text-sm font-medium mb-1">
                            Estoque Mínimo <span class="text-red-500">*</span>
                        </label>
                        <input v-model="store.form.minimo" type="number" id="minimo" name="minimo" required
                            placeholder="Ex: 10" class="w-full p-2 rounded-md border bg-card border-border" />
                    </div>

                    <!-- Unidade de medida -->
                    <div class="md:col-span-4">
                        <label for="unidade_select_produto" class="block text-sm font-medium mb-1">
                            Unidade <span class="text-red-500">*</span>
                        </label>
                        <select v-model="store.form.unidade" required
                            class="w-full p-2.5 rounded-md border bg-card border-border" name="unidade"
                            id="unidade_select_produto">
                            <option value="">Selecione uma unidade</option>
                            <option value="un">Unidade</option>
                            <option value="kg">Quilograma</option>
                            <option value="l">Litro</option>
                            <option value="m">Metro</option>
                            <option value="g">Gramas</option>
                            <option value="cm">Centimetros</option>
                            <option value="mm">Milimetros</option>
                            <option value="mg">Miligramas</option>
                            <option value="ml">Mililitro</option>
                            <option value="cx">Caixa</option>
                        </select>
                    </div>

                    <!-- Observação -->
                    <div class="md:col-span-12">
                        <label for="descricao" class="block text-sm font-medium mb-1">Observação</label>
                        <textarea v-model="store.form.descricao" id="descricao" name="descricao" rows="4"
                            placeholder="Adicione observações sobre o produto"
                            class="w-full p-2 rounded-md border bg-card border-border"></textarea>
                    </div>

                    <input type="hidden" id="id" name="id" />
                </div>
            </div>
            <div class="flex justify-end gap-2">
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