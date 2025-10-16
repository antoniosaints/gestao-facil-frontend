<script setup lang="ts">
import Calendarpicker from "@/components/formulario/calendarpicker.vue";
import ModalView from "@/components/formulario/ModalView.vue";
import Select2Ajax from "@/components/formulario/Select2Ajax.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLancamentosStore } from "@/stores/lancamentos/useLancamentos";
import { computed, ref } from "vue";
import { vMaska } from "maska/vue"
import { moneyMaskOptions } from "@/lib/imaska";
import type { FormularioLancamento } from "@/types/schemas";
import { LancamentosRepository } from "@/repositories/lancamento-repository";
import { useToast } from "vue-toastification";
import { formatToNumberValue } from "@/utils/formatters";
import { useClientesStore } from "@/stores/clientes/useClientes";
import FormularioContas from "../modais/FormularioContas.vue";
import FormularioCategorias from "../modais/FormularioCategorias.vue";

const description = ref('Preencha os campos abaixo')
const store = useLancamentosStore()
const storeCliente = useClientesStore()
const toast = useToast()

const params = ref<{ metodo: "AVISTA" | "PARCELADO", lancamentoEfetivado: boolean }>({
    metodo: "AVISTA",
    lancamentoEfetivado: false
})
const title = computed(() => {
    const tipo = store.form.tipo === "RECEITA" ? "receita" : "despesa"
    return params.value.metodo === "AVISTA" ? `Lançamento de ${tipo}` : `Lançamento parcelado (${tipo})`
})

async function submit() {
    try {
        const data = {
            categoriaId: store.form.categoriaId,
            clienteId: store.form.clienteId,
            descricao: store.form.descricao,
            contasFinanceiroId: store.form.contasFinanceiroId,
            dataEntrada: store.form.dataEntrada,
            dataLancamento: store.form.dataLancamento,
            desconto: formatToNumberValue(store.form.desconto),
            lancamentoEfetivado: params.value.lancamentoEfetivado,
            tipoLancamentoModo: params.value.metodo,
            formaPagamento: store.form.formaPagamento,
            parcelas: store.form.parcelas,
            valorEntrada: formatToNumberValue(store.form.valorEntrada),
            tipo: store.form.tipo,
            valorTotal: formatToNumberValue(store.form.valorTotal),
        } as FormularioLancamento & { lancamentoEfetivado: boolean, tipoLancamentoModo: "AVISTA" | "PARCELADO" }

        await LancamentosRepository.save(data)
        store.openModal = false
        store.updateTable()
        store.reset()
        params.value = { metodo: "AVISTA", lancamentoEfetivado: false }
        toast.success('Lançamento cadastrado com sucesso')
    } catch (error: any) {
        console.log(error)
        toast.error(error?.response?.data?.message || 'Erro ao realizar o cadastro!')
    }
}

</script>

<template>
    <ModalView v-model:open="store.openModal" :title="title" :description="description" size="3xl">
        <form class="space-y-4 px-4" @submit.prevent="submit">
            <div class="grid grid-cols-1 gap-3">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div class="md:col-span-8">
                        <label for="descricao" class="block text-sm font-medium mb-1">
                            Descrição *
                        </label>
                        <Input v-model="store.form.descricao" type="text" id="descricao" name="descricao" required
                            placeholder="Ex: Venda de 1 notebook" />
                    </div>
                    <div class="md:col-span-4">
                        <label for="dataFinanceiroLancamento" class="block text-sm font-medium mb-1">
                            Data Lançamento *
                        </label>
                        <Calendarpicker id="dataFinanceiroLancamento" name="dataLancamento"
                            v-model="store.form.dataLancamento" />
                    </div>
                    <!-- Tipo -->
                    <div class="md:col-span-4">
                        <label for="tipoLancamentoFinanceiro" class="block text-sm font-medium mb-1">
                            Tipo/Natureza *
                        </label>
                        <Select disabled v-model="store.form.tipo" required>
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
                    <div class="md:col-span-4">
                        <label for="valorTotalLancamento" class="block text-sm font-medium mb-1">
                            Valor Total *
                        </label>
                        <Input type="text" v-maska="moneyMaskOptions" id="valorTotalLancamento"
                            v-model="store.form.valorTotal" name="valorTotal" required placeholder="0,00" />
                    </div>

                    <div class="md:col-span-4">
                        <label for="descontoFormularioLancamento" class="block text-sm font-medium mb-1">
                            Desconto
                        </label>
                        <Input type="text" v-maska="moneyMaskOptions" v-model="store.form.desconto"
                            id="descontoFormularioLancamento" name="desconto" placeholder="0,00" />
                    </div>
                    <!-- Valor Total -->
                    <div class="md:col-span-6">
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

                    <div class="block text-sm font-medium mb-1 md:col-span-6">
                        <span class="block text-sm font-medium mb-0">
                            Efetivado
                        </span>
                        <div class="gap-2 mt-1 items-center">
                            <div>
                                <label for="lancamentoEfetivadoTotal"
                                    class="border cursor-pointer bg-card dark:bg-card-dark border-border px-3 h-[36px] flex rounded-lg">
                                    <div class="flex items-center">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <Switch id="lancamentoEfetivadoTotal"
                                                v-model="params.lancamentoEfetivado" />
                                            <span
                                                class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Efetivado</span>
                                        </label>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div v-if="params.metodo === 'PARCELADO'"
                        class="grid grid-cols-1 md:grid-cols-3 gap-3 md:col-span-12">
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
                            <Input type="text" v-maska="moneyMaskOptions" v-model="store.form.valorEntrada"
                                id="valorEntradaLancamento" name="valorEntrada" placeholder="0,00" />
                        </div>

                        <!-- Data Entrada -->
                        <div>
                            <label for="dataEntradaLancamento" class="block text-sm font-medium mb-1">
                                Data Entrada
                            </label>
                            <Calendarpicker :required="store.form.valorEntrada != ''" id="dataEntradaLancamento"
                                name="dataEntrada" v-model="store.form.dataEntrada" />
                        </div>
                    </div>
                    <!-- Forma de Pagamento -->
                    <div class="md:col-span-6">
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
                    <!-- Cliente -->
                    <div class="md:col-span-6">
                        <label for="clienteIdLancamento" class="block text-sm font-medium mb-1">
                            {{ store.form.tipo === 'RECEITA' ? 'Cliente' : 'Fornecedor' }}
                            <a @click="storeCliente.openSave" class="text-blue-500 px-2 cursor-pointer">+ Novo</a>
                        </label>
                        <Select2Ajax id="clienteIdLancamento" v-model="store.form.clienteId" url="/clientes/select2"
                            allowClear />
                    </div>
                    <!-- Categoria -->
                    <div class="md:col-span-6">
                        <label for="categoriaIdLancamento" class="block text-sm font-medium mb-1">
                            Categoria *
                            <FormularioCategorias class="text-blue-500 px-2 cursor-pointer">+ Nova
                            </FormularioCategorias>
                        </label>
                        <Select2Ajax id="categoriaIdLancamento" v-model="store.form.categoriaId" required
                            url="lancamentos/categorias/select2" />
                    </div>
                    <!-- Conta Financeiro -->
                    <div class="md:col-span-6">
                        <label for="contasFinanceiroId" class="block text-sm font-medium mb-1">
                            Conta Financeira *
                            <FormularioContas class="text-blue-500 px-2 cursor-pointer">+ Nova</FormularioContas>
                        </label>
                        <Select2Ajax id="contasFinanceiroId" v-model="store.form.contasFinanceiroId" required
                            url="lancamentos/contas/select2" />
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
            </div>
        </form>
    </ModalView>
</template>
