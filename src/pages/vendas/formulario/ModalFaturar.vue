<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue';
import { useVendasStore } from '@/stores/vendas/useVenda';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { VendaRepository, type VendaEfetivar } from '@/repositories/venda-repository';
import { MetodoPagamento } from '@/@types/schemas';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import Select2Ajax from '@/components/formulario/Select2Ajax.vue';
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import { Switch } from '@/components/ui/switch';
import FormularioCategorias from '@/pages/financeiro/lancamentos/modais/FormularioCategorias.vue';
import FormularioContas from '@/pages/financeiro/lancamentos/modais/FormularioContas.vue';

const store = useVendasStore();
const toast = useToast();

const faturarVenda = ref<VendaEfetivar>({
    categoria: 0,
    conta: 0,
    dataPagamento: new Date().toISOString().split('T')[0],
    pagamento: MetodoPagamento.PIX,
    lancamentoManual: false
})

async function submit() {
    try {
        if (!store.idMutation) return toast.error('ID nao informado!')
        await VendaRepository.efetivar(store.idMutation as number, faturarVenda.value)
        store.idMutation = null;
        store.openModalFaturar = false;
        store.updateTable();
        toast.success('Venda faturada com sucesso')
    } catch (error: any) {
        console.log(error)
        store.idMutation = null;
        store.openModalFaturar = false
        toast.error('Erro ao faturar a venda!', {
            timeout: 3000,
        })
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModalFaturar" title="Faturar venda" size="lg"
        description="Preencha os dados para faturar a venda">
        <form @submit.prevent="submit" class="flex flex-col px-4">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full grid grid-cols-2 gap-4">
                <div class="w-full gap-2 flex flex-col">
                    <Label for="formaPagamento">Forma de pagamento</Label>
                    <Select v-model="faturarVenda.pagamento">
                        <SelectTrigger class="w-full bg-card">
                            <SelectValue placeholder="Selecione o pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Formas de Pagamento</SelectLabel>
                                <SelectItem value="PIX">PIX</SelectItem>
                                <SelectItem value="DINHEIRO">DINHEIRO</SelectItem>
                                <SelectItem value="CARTAO">CARTÃO</SelectItem>
                                <SelectItem value="BOLETO">BOLETO</SelectItem>
                                <SelectItem value="TRANSFERENCIA">TRANSFERÊNCIA</SelectItem>
                                <SelectItem value="CHEQUE">CHEQUE</SelectItem>
                                <SelectItem value="CREDITO">CRÉDITO</SelectItem>
                                <SelectItem value="DEBITO">DÉBITO</SelectItem>
                                <SelectItem value="GATEWAY">GATEWAY</SelectItem>
                                <SelectItem value="OUTRO">OUTRO</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="dataPagamento">Data</Label>
                    <Calendarpicker id="dataPagamento" required teleport
                        v-model="(faturarVenda.dataPagamento as Date)" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="contaPagamento">Conta <FormularioContas class="text-blue-500 px-2 cursor-pointer">
                            + Nova
                        </FormularioContas>
                    </Label>
                    <Select2Ajax id="contaPagamento" required v-model="faturarVenda.conta" class="w-full"
                        url="lancamentos/contas/select2" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="categoriaFinanceira">Categoria <FormularioCategorias
                            class="text-blue-500 px-2 cursor-pointer">+ Nova
                        </FormularioCategorias></Label>
                    <Select2Ajax id="categoriaFinanceira" required v-model="faturarVenda.categoria" class="w-full"
                        url="lancamentos/categorias/select2" />
                </div>
                <div class="flex items-center bg-card justify-between border rounded-lg p-3 col-span-2">
                    <div>
                        <Label>Lançamento manual</Label>
                        <p class="text-sm text-muted-foreground">Não criar financeiro para essa venda.</p>
                    </div>
                    <Switch v-model="faturarVenda.lancamentoManual" />
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModalFaturar = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>