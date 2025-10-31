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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { BadgeInfo } from "lucide-vue-next"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    <ModalView v-model:open="store.openModal" :title="title" description="Preencha os campos abaixo" size="3xl">
        <form @submit.prevent="submit" class="grid items-start gap-4 px-4">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full space-y-2">
                <div class="grid grid-cols-12 gap-4">
                    <!-- Nome -->
                    <div class="col-span-12 lg:col-span-12">
                        <label for="nome" class="block text-sm font-medium mb-1">
                            Produto <span class="text-red-500">*</span>
                        </label>
                        <Input type="text" id="nome" name="nome" required placeholder="Nome do produto"
                            v-model="store.form.nome" />
                    </div>

                    <div class="col-span-6 lg:col-span-3 flex flex-col w-full">
                        <label for="saidas" class="text-sm font-medium mb-0 flex items-center gap-2">
                            Permite saídas
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <BadgeInfo class="inline-flex w-4 cursor-pointer text-blue-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p class="max-w-xs text-white">Informa se o produto pode realizar saídas
                                            (Vendas, Devoluções e etc).
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </label>
                        <div class="flex mt-[3px]">
                            <div class="w-full">
                                <div class="border bg-card border-border px-3 py-[8px] rounded-lg">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <Switch v-model:model-value="store.form.saidas" />
                                            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{
                                                store.form.saidas ? 'Sim' : 'Nao' }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-6 lg:col-span-3 flex flex-col w-full">
                        <label for="entrada" class="text-sm font-medium mb-0 flex items-center gap-2">
                            Permite entrada
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <BadgeInfo class="inline-flex w-4 cursor-pointer text-blue-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p class="max-w-xs text-white">Informa se o produto pode receber reposições de
                                            estoque.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </label>
                        <div class="flex mt-[3px]">
                            <div class="w-full">
                                <div class="border bg-card border-border px-3 py-[8px] rounded-lg">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <Switch v-model:model-value="store.form.entradas" />
                                            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{
                                                store.form.entradas ? 'Sim' : 'Nao' }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-6 lg:col-span-3 flex flex-col w-full">
                        <label for="producao" class="text-sm font-medium mb-0 flex items-center gap-2">
                            Produção local
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <BadgeInfo class="inline-flex w-4 cursor-pointer text-blue-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p class="max-w-xs text-white">Selecione caso o produto seja produzido no local,
                                            serve para casos
                                            de lanchonetes, restaurantes, etc.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </label>
                        <div class="flex mt-[3px]">
                            <div class="w-full">
                                <div class="border bg-card border-border px-3 py-[8px] rounded-lg">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <Switch v-model:model-value="store.form.producaoLocal" />
                                            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{
                                                store.form.producaoLocal ? 'Sim' : 'Nao' }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-6 lg:col-span-3 flex flex-col w-full">
                        <label for="controle" class="text-sm font-medium mb-0 flex items-center gap-2">
                            Controla estoque
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger as-child>
                                        <BadgeInfo class="inline-flex w-4 cursor-pointer text-blue-600" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p class="max-w-xs text-white">O estoque será debitado de acordo com o uso em
                                            outros locais do sistema,
                                            caso esteja desmarcado, o estoque não será contabilizado em saídas de
                                            estoque.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </label>
                        <div class="flex mt-[3px]">
                            <div class="w-full">
                                <div class="border bg-card border-border px-3 py-[8px] rounded-lg">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <Switch v-model:model-value="store.form.controlaEstoque" />
                                            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{{
                                                store.form.controlaEstoque ? 'Sim' : 'Nao' }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Código -->
                    <div class="col-span-6">
                        <label for="codigo" class="block text-sm font-medium mb-1">Código</label>
                        <Input v-model="store.form.codigo" type="text" id="codigo" name="codigo"
                            placeholder="Código do produto" />
                    </div>

                    <!-- Preço -->
                    <div class="col-span-6">
                        <label for="precoProdutoCompra" class="block text-sm font-medium mb-1">
                            Preço Compra
                        </label>
                        <Input v-model="store.form.precoCompra" v-maska="moneyMaskOptions" type="text"
                            ref="precoProdutoCompra" name="precoCompra" placeholder="Ex: 79,90" />
                    </div>

                    <div class="col-span-6">
                        <label for="precoProdutoVenda" class="block text-sm font-medium mb-1">
                            Preço <span class="text-red-500">*</span>
                        </label>
                        <Input v-model="store.form.preco" v-maska="moneyMaskOptions" type="text" id="precoProdutoVenda"
                            name="preco" required placeholder="Ex: 99,90" />
                    </div>

                    <!-- Estoque Inicial -->
                    <div class="col-span-6">
                        <label for="estoque" class="block text-sm font-medium mb-1">
                            Estoque Inicial <span class="text-red-500">*</span>
                        </label>
                        <Input v-model="store.form.estoque" :readonly="store.form.id != null" type="number" id="estoque"
                            name="estoque" required placeholder="Ex: 100"
                            class="read-only:bg-body read-only:cursor-not-allowed" />
                    </div>

                    <!-- Estoque Mínimo -->
                    <div class="col-span-6">
                        <label for="minimo" class="block text-sm font-medium mb-1">
                            Estoque Mínimo <span class="text-red-500">*</span>
                        </label>
                        <Input v-model="store.form.minimo" type="number" id="minimo" name="minimo" required
                            placeholder="Ex: 10" />
                    </div>

                    <!-- Unidade de medida -->
                    <div class="col-span-6">
                        <label for="unidade_select_produto" class="block text-sm font-medium mb-1">
                            Unidade <span class="text-red-500">*</span>
                        </label>
                        <Select v-model="store.form.unidade" required>
                            <SelectTrigger class="w-full">
                                <SelectValue placeholder="Selecione a unidade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="un">Unidade</SelectItem>
                                    <SelectItem value="kg">Quilograma</SelectItem>
                                    <SelectItem value="l">Litro</SelectItem>
                                    <SelectItem value="m">Metro</SelectItem>
                                    <SelectItem value="g">Gramas</SelectItem>
                                    <SelectItem value="cm">Centimetros</SelectItem>
                                    <SelectItem value="mm">Milimetros</SelectItem>
                                    <SelectItem value="mg">Miligramas</SelectItem>
                                    <SelectItem value="ml">Mililitro</SelectItem>
                                    <SelectItem value="cx">Caixa</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <!-- Observação -->
                    <div class="col-span-12">
                        <label for="descricao" class="block text-sm font-medium mb-1">Observação</label>
                        <Textarea v-model="store.form.descricao" id="descricao" name="descricao" rows="4"
                            placeholder="Adicione observações sobre o produto"></Textarea>
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