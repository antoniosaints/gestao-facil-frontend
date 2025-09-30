<script setup lang="ts">
import Calendarpicker from "@/components/formulario/calendarpicker.vue";
import ModalView from "@/components/formulario/ModalView.vue";
import Select2Ajax from "@/components/formulario/Select2Ajax.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLancamentosStore } from "@/stores/lancamentos/useLancamentos";
import { ref } from "vue";

const title = ref('Cadastro de lançamentos')
const description = ref('Preencha os campos abaixo')
const store = useLancamentosStore()

const params = ref<{ metodo: "AVISTA" | "PARCELADO", efetivado: boolean }>({
    metodo: "AVISTA",
    efetivado: false
})

</script>

<template>
    <ModalView v-model:open="store.openModal" :title="title" :description="description" size="3xl">
        <form id="modalFormularioLancamentos" class="space-y-4 px-4">
            <div class="grid grid-cols-1 gap-6">
                <div>
                    <label for="descricao" class="block text-sm font-medium mb-1">
                        Descrição *
                    </label>
                    <Input v-model="store.form.descricao" type="text" id="descricao" name="descricao" required
                        placeholder="Ex: Venda de 1 notebook" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <!-- Tipo -->
                    <div>
                        <label for="tipoLancamentoFinanceiro" class="block text-sm font-medium mb-1">
                            Tipo/Natureza *
                        </label>
                        <Select v-model="store.form.tipo" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Natureza" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RECEITA">
                                    Receita
                                </SelectItem>
                                <SelectItem value="DESPESA">
                                    Despesa
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <!-- Valor Total -->
                    <div>
                        <label for="valorTotalLancamento" class="block text-sm font-medium mb-1">
                            Valor Total *
                        </label>
                        <Input type="text" id="valorTotalLancamento" name="valorTotal" required placeholder="0,00" />
                    </div>
                    <!-- Valor Total -->
                    <div>
                        <label for="metodoLancamentoModoLancamento" class="block text-sm font-medium mb-1">
                            Método *
                        </label>
                        <Select v-model="params.metodo" required id="metodoLancamentoModoLancamento">
                            <SelectTrigger>
                                <SelectValue placeholder="Forma de pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AVISTA">
                                    Á vista
                                </SelectItem>
                                <SelectItem value="PARCELADO">
                                    Parcelado
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                <div v-if="params.metodo === 'PARCELADO'" class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <!-- Parcelas -->
                    <div>
                        <label for="parcelas" class="block text-sm font-medium mb-1">
                            Parcelas *
                        </label>
                        <Input type="number" id="parcelas" name="parcelas" placeholder="1" required min="1"
                            v-model="store.form.parcelas" />
                    </div>
                    <!-- Valor Entrada -->
                    <div>
                        <label for="valorEntradaLancamento" class="block text-sm font-medium mb-1">
                            Valor Entrada
                        </label>
                        <Input type="text" id="valorEntradaLancamento" name="valorEntrada" placeholder="0,00" />
                    </div>

                    <!-- Data Entrada -->
                    <div>
                        <label for="dataEntradaLancamento" class="block text-sm font-medium mb-1">
                            Data Entrada
                        </label>
                        <Calendarpicker id="dataEntradaLancamento" name="dataEntrada"
                            v-model="store.form.dataEntrada" />
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <!-- Desconto -->
                    <div>
                        <label for="descontoFormularioLancamento" class="block text-sm font-medium mb-1">
                            Desconto
                        </label>
                        <Input type="text" id="descontoFormularioLancamento" name="desconto" placeholder="0,00" />
                    </div>

                    <!-- Forma de Pagamento -->
                    <div>
                        <label for="formaPagamentoLancamento" class="block text-sm font-medium mb-1">
                            Forma de Pagamento *
                        </label>
                        <Select v-model="store.form.formaPagamento" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Forma de pagamento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PIX">
                                    PIX
                                </SelectItem>
                                <SelectItem value="DINHEIRO">
                                    Dinheiro
                                </SelectItem>
                                <SelectItem value="CREDITO">
                                    Cartão de Crédito
                                </SelectItem>
                                <SelectItem value="DEBITO">
                                    Cartão de Débito
                                </SelectItem>
                                <SelectItem value="BOLETO">
                                    Boleto
                                </SelectItem>
                                <SelectItem value="TRANSFERENCIA">
                                    Transferência
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div class="block text-sm font-medium mb-1">
                        <span class="block text-sm font-medium mb-0">
                            Efetivado
                        </span>
                        <div class="gap-2 mt-1 items-center">
                            <div>
                                <label for="lancamentoEfetivadoTotal"
                                    class="border cursor-pointer bg-card dark:bg-card-dark border-border px-3 h-[36px] flex rounded-lg">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <Switch id="lancamentoEfetivadoTotal" v-model="params.efetivado" />
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
                        <Calendarpicker id="dataFinanceiroLancamento" name="dataLancamento"
                            v-model="store.form.dataLancamento" />
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
