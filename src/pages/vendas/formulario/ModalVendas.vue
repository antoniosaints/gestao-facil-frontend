<script setup lang="ts">
import ModalView from "@/components/formulario/ModalView.vue";
import { Button } from "@/components/ui/button";
import { ref } from "vue";

const title = ref('Cadastro de venda')
const description = ref('Preencha os campos abaixo')

const open = defineModel({ default: false })
</script>

<template>
    <ModalView v-model:open="open" :title="title" :description="description" size="5xl">
        <form id="formulario_cadastro_venda" class="space-y-4 px-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-6">
                    <label class="block text-sm mb-1">Cliente</label>
                    <div class="flex items-center justify-center gap-2">
                        <select id="select_cliente_venda_formulario" name="cliente"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">

                        </select>
                        <button type="button" onclick="openModalClientes()"
                            class="bg-blue-500 px-4 py-2 text-white dark:bg-blue-600 rounded-md border border-border dark:border-border-dark flex justify-center items-center">+</button>
                    </div>
                </div>

                <div class="md:col-span-3">
                    <label class="block text-sm mb-1">Data da Venda <span class="text-red-500">*</span></label>
                    <input type="date" required id="input_data_venda_formulario" placeholder="DD/MM/AAAA"
                        name="data_venda"
                        class="w-full p-1.5 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
                </div>

                <div class="md:col-span-3">
                    <label class="block text-sm mb-1">Status <span class="text-red-500">*</span></label>
                    <select required name="status" id="select_status_venda_formulario"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                        <option value="ORCAMENTO">Orçamento</option>
                        <option value="ANDAMENTO">Em andamento</option>
                        <option value="FINALIZADO" selected>Finalizado</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="CANCELADO">Cancelado</option>
                    </select>
                </div>

                <div class="md:col-span-6">
                    <label class="block text-sm mb-1">Vendedor <span class="text-red-500">*</span></label>
                    <select required id="select_vendedor_venda_formulario" name="vendedor"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </select>
                </div>


                <div class="md:col-span-2">
                    <label class="block text-sm mb-1">Garantia (dias)</label>
                    <input type="number" name="garantia" id="input_garantia_venda_formulario"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark"
                        placeholder="Ex: 90 dias" />
                </div>

                <div class="md:col-span-2">
                    <label for="tipo_desconto" class="block text-sm mb-1">Tipo <span
                            class="text-red-500">*</span></label>
                    <select required name="tipo_desconto" id="select_tipo_desconto_formulario"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                        <option value="PORCENTAGEM">Porcentagem</option>
                        <option value="VALOR">Valor</option>
                    </select>
                </div>
                <div class="md:col-span-2">
                    <label for="input_desconto_venda_formulario" class="block text-sm mb-1">Desconto</label>
                    <input type="text" id="input_desconto_venda_formulario" name="desconto"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark"
                        placeholder="Ex: 1,99" />
                </div>
            </div>

            <!-- Observações -->
            <div>
                <label class="block text-sm mb-1">Observações</label>
                <textarea name="observacoes" id="input_observacoes_venda_formulario"
                    class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark"
                    rows="3" placeholder="Observações da venda..."></textarea>
            </div>

            <hr class="border-border dark:border-border-dark">

            <!-- Adição de produtos -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div class="md:col-span-6">
                    <label class="block text-sm mb-1">Produto <span class="text-red-500">*</span></label>
                    <select id="select_produto_venda_formulario"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </select>
                </div>

                <div class="md:col-span-2">
                    <label class="block text-sm mb-1">Quantidade <span class="text-red-500">*</span></label>
                    <input type="number" placeholder="1" id="input_quantidade_venda_formulario"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
                </div>

                <div class="md:col-span-2">
                    <label class="block text-sm mb-1">Preço <span class="text-red-500">*</span></label>
                    <input type="text" placeholder="R$ 0,00" id="input_preco_venda_formulario"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark" />
                </div>

                <div class="md:col-span-2">
                    <button id="btn_adicionar_produto_venda" type="button"
                        class="w-full p-2 bg-info dark:bg-info-dark text-white rounded"><i
                            class="fa-solid fa-cart-plus"></i>
                        Adicionar</button>
                </div>
            </div>

            <!-- Tabela de itens -->
            <div>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-medium mb-2">Itens da Venda</h3>
                    <div>

                        <button onclick="informarValorPropostoCliente()" type="button"
                            class="text-sm text-white py-1 px-2 mb-2 rounded bg-emerald-500 dark:bg-emerald-600 dark:text-gray-200"><i
                                class="fa-solid fa-money-bill"></i> Propor</button>
                        <button id="btn_limpar_carrinho" type="button"
                            class="text-sm text-white py-1 px-2 mb-2 rounded bg-red-500 dark:bg-red-600 dark:text-gray-200"><i
                                class="fa-solid fa-cart-shopping"></i> Limpar</button>
                    </div>
                </div>
                <div class="relative overflow-x-auto sm:rounded-lg">
                    <div class="grid grid-cols-12 gap-4">
                        <!-- Lista do carrinho -->
                        <div id="lista-carrinho-vendas" class="col-span-12 lg:col-span-8 space-y-2">
                            <div class="p-3 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-md">
                                Nenhum item adicionado
                            </div>
                        </div>

                        <!-- Total do carrinho -->
                        <div id="resumo-carrinho-vendas"
                            class="col-span-12 lg:col-span-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4 shadow-sm">
                            <h3 class="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Resumo</h3>
                            <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>Desconto:</span>
                                <span id="desconto-total-carrinho">R$ 0,00</span>
                            </div>
                            <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                                <span>Subtotal:</span>
                                <span id="subtotal-carrinho-vendas">R$ 0,00</span>
                            </div>
                            <div class="flex justify-between text-bold text-md text-gray-700 dark:text-gray-300">
                                <span>Total:</span>
                                <span id="total-carrinho-vendas">R$ 0,00</span>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
            <input type="hidden" name="id" id="input_id_venda_formulario" value="{{venda.id}}">
            <div class="flex justify-end gap-2">
                <Button type="button" variant="secondary" @click="open = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>
