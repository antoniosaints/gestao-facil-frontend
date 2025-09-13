<script setup lang="ts">
import ModalView from "@/components/formulario/ModalView.vue";
import Select2Ajax from "@/components/formulario/Select2Ajax.vue";
import { Button } from "@/components/ui/button";
import { useLancamentosStore } from "@/stores/lancamentos/useLancamentos";
import { ref } from "vue";

const title = ref('Cadastro de lançamentos')
const description = ref('Preencha os campos abaixo')
const store = useLancamentosStore()

</script>

<template>
    <ModalView v-model:open="store.openModal" :title="title" :description="description" size="3xl">
        <form id="modalFormularioLancamentos" class="space-y-4 px-4">
            <div class="grid grid-cols-1 gap-6">
                <div>
                    <label for="descricao" class="block text-sm font-medium mb-1">
                        Descrição *
                    </label>
                    <input type="text" id="descricao" name="descricao" required placeholder="Ex: Venda de 1 notebook"
                        class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <!-- Tipo -->
                    <div>
                        <label for="tipoLancamentoFinanceiro" class="block text-sm font-medium mb-1">
                            Tipo *
                        </label>
                        <select id="tipoLancamentoFinanceiro" name="tipo" required
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                            <option value="">Selecione o tipo</option>
                            <option value="RECEITA">Receita</option>
                            <option value="DESPESA">Despesa</option>
                        </select>
                    </div>

                    <!-- Valor Total -->
                    <div>
                        <label for="valorTotalLancamento" class="block text-sm font-medium mb-1">
                            Valor Total *
                        </label>
                        <input type="text" id="valorTotalLancamento" name="valorTotal" required placeholder="0,00"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </div>
                    <!-- Valor Total -->
                    <div>
                        <label for="metodoLancamentoModoLancamento" class="block text-sm font-medium mb-1">
                            Método *
                        </label>
                        <select name="tipoLancamentoModo" id="metodoLancamentoModoLancamento" required
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                            <option value="">Forma de pagamento</option>
                            <option value="AVISTA">À vista</option>
                            <option value="PARCELADO">Parcelado</option>
                        </select>
                    </div>

                </div>

                <div id="modalFormularioLancamentosParcelamento" class="grid hidden grid-cols-1 md:grid-cols-3 gap-2">
                    <!-- Parcelas -->
                    <div>
                        <label for="parcelas" class="block text-sm font-medium mb-1">
                            Parcelas *
                        </label>
                        <input type="number" id="parcelas" name="parcelas" required min="1" value="1"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </div>
                    <!-- Valor Entrada -->
                    <div>
                        <label for="valorEntradaLancamento" class="block text-sm font-medium mb-1">
                            Valor Entrada
                        </label>
                        <input type="text" id="valorEntradaLancamento" name="valorEntrada" placeholder="0,00"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </div>

                    <!-- Data Entrada -->
                    <div>
                        <label for="dataEntradaLancamento" class="block text-sm font-medium mb-1">
                            Data Entrada
                        </label>
                        <input type="text" placeholder="dd/mm/aaaa" id="dataEntradaLancamento" name="dataEntrada"
                            class="w-full p-2 rounded-md disabled:bg-gray-300 dark:disabled:bg-gray-900 border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <!-- Desconto -->
                    <div>
                        <label for="descontoFormularioLancamento" class="block text-sm font-medium mb-1">
                            Desconto
                        </label>
                        <input type="text" id="descontoFormularioLancamento" name="desconto" placeholder="0,00"
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </div>

                    <!-- Forma de Pagamento -->
                    <div>
                        <label for="formaPagamentoLancamento" class="block text-sm font-medium mb-1">
                            Forma de Pagamento *
                        </label>
                        <select id="formaPagamentoLancamento" name="formaPagamento" required
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                            <option value="">Selecione a forma</option>
                            <option value="PIX">PIX</option>
                            <option value="DINHEIRO">Dinheiro</option>
                            <option value="CREDITO">Cartão de Crédito</option>
                            <option value="DEBITO">Cartão de Débito</option>
                            <option value="BOLETO">Boleto</option>
                            <option value="TRANSFERENCIA">Transferência</option>
                        </select>
                    </div>

                    <div class="block text-sm font-medium mb-1">
                        <span class="block text-sm font-medium mb-0">
                            Efetivado
                        </span>
                        <div class="gap-2 mt-1 items-center">
                            <div>
                                <label for="lancamentoEfetivadoTotal"
                                    class="border block cursor-pointer bg-card dark:bg-card-dark border-border dark:border-border-dark px-3 py-2.5 rounded-md">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="lancamentoEfetivadoTotal"
                                                name="lancamentoEfetivado" class="sr-only peer" />
                                            <div
                                                class="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:peer-focus:ring-primary-dark dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-primary-dark">
                                            </div>
                                            <span
                                                class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Efetivado</span>
                                        </label>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <!-- Cliente -->
                    <div>
                        <label for="clienteIdLancamento" class="block text-sm font-medium mb-1">
                            Cliente
                            <a onclick="openModalClientes()" class="text-blue-500 px-2 cursor-pointer">Novo</a>
                        </label>
                        <Select2Ajax id="clienteIdLancamento" v-model="store.form.clienteId" url="/clientes/select2"
                            allowClear required />
                    </div>

                    <!-- Categoria -->
                    <div>
                        <label for="categoriaIdLancamento" class="block text-sm font-medium mb-1">
                            Categoria *
                            <a onclick="openModalCategoriaFinanceira()"
                                class="text-blue-500 px-2 cursor-pointer">Nova</a>
                        </label>
                        <Select2Ajax id="categoriaIdLancamento" required url="lancamentos/categorias/select2" />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <!-- Data Lançamento -->
                    <div>
                        <label for="dataFinanceiroLancamento" class="block text-sm font-medium mb-1">
                            Data Lançamento *
                        </label>
                        <input type="text" placeholder="dd/mm/aaaa" id="dataFinanceiroLancamento" name="dataLancamento"
                            required
                            class="w-full p-2 rounded-md border bg-card dark:bg-card-dark border-border dark:border-border-dark">
                    </div>

                    <!-- Conta Financeiro -->
                    <div>
                        <label for="contasFinanceiroId" class="block text-sm font-medium mb-1">
                            Conta Financeira *
                            <a onclick="openModalContasFinanceiras()" class="text-blue-500 px-2 cursor-pointer">Nova</a>
                        </label>
                        <Select2Ajax id="contasFinanceiroId" required url="lancamentos/contas/select2" />
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
            </div>
        </form>
    </ModalView>
</template>
