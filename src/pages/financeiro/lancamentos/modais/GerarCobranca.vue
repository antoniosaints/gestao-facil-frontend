<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { moneyMaskOptions } from '@/lib/imaska'
import { Copy, ExternalLink, FilePlus, Receipt } from 'lucide-vue-next'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { vMaska } from "maska/vue"
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { useClientesStore } from '@/stores/clientes/useClientes'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'

const storeCobranca = useCobrancasFinanceirasStore()
const storeClientes = useClientesStore()
const toast = useToast()
const gateway = ref<'mercadopago' | 'pagseguro' | 'asaas' | undefined>()
const criterio = ref<'pendente' | 'pago' | 'total' | 'avulso'>('avulso')
const tipo = ref<'LINK' | 'BOLETO' | 'PIX'>('PIX')
const clienteId = ref<number | null>(null)
const valorAvulso = ref("")
const loading = ref(false)
const submitText = ref('Gerar cobrança')
const linkExists = ref(false)
const linkPayment = ref('')

const resetModal = () => {
    gateway.value = undefined
    criterio.value = 'avulso'
    tipo.value = 'PIX'
    clienteId.value = null
    valorAvulso.value = ''
    linkExists.value = false
    linkPayment.value = ''
}

async function gerarCobrancaLancamento() {
    try {
        if (!gateway.value) return toast.error('Gateway de pagamento nao informado!', {
            timeout: 5000
        })
        if (criterio.value === "avulso" && !valorAvulso.value) return toast.error('Informe o valor da cobrança avulsa.', {
            timeout: 5000
        })
        if (tipo.value === "BOLETO") {
            if (!clienteId.value) {
                return toast.error('Informe o cliente para gerar o boleto.', {
                    timeout: 5000
                })
            }
            if (Number(valorAvulso.value.replace(",", ".")) < 4) {
                return toast.error('O valor mínimo para boleto é R$ 4,00', {
                    timeout: 5000
                })
            }
        }
        loading.value = true
        submitText.value = 'Gerando cobrança...'
        const response = await LancamentosRepository.gerarCobranca(tipo.value, Number(valorAvulso.value), gateway.value, clienteId.value, storeCobranca.vinculoCobranca)
        linkPayment.value = response.message
        linkExists.value = true
        toast.success('Cobrança gerada com sucesso.', {
            timeout: 5000
        })
        storeCobranca.vinculoCobranca = undefined;
        loading.value = false
        submitText.value = 'Gerar cobrança'
        storeCobranca.updateTable()
    } catch (error: any) {
        console.log(error)
        toast.error(error.response?.data?.message || 'Erro ao gerar cobrança', {
            timeout: 5000
        })
        loading.value = false
        submitText.value = 'Gerar cobrança'
    }
}

function copiarLink() {
    navigator.clipboard.writeText(linkPayment.value)
    toast.success('Link copiado com sucesso!')
}
function acessarLink() {
    window.open(linkPayment.value, '_blank')
}

</script>

<template>
    <ModalView v-model:open="storeCobranca.openModal" title="Gerar cobrança" size="lg"
        description="Gerar uma cobrança de pagamento">
        <div class="grid gap-4 px-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4" v-if="!linkExists">
                    <div class="md:col-span-6">
                        <label class="block text-sm font-medium mb-1">
                            Gateway
                        </label>
                        <Select v-model="gateway">
                            <SelectTrigger class="w-full">
                                <SelectValue placeholder="Selecione o gateway" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="mercadopago">Mercado pago</SelectItem>
                                    <SelectItem value="asaas" disabled>Asaas</SelectItem>
                                    <SelectItem value="pagseguro" disabled>Pagseguro</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="md:col-span-6">
                        <label class="block text-sm font-medium mb-1">
                            Critério
                        </label>
                        <Select v-model="criterio">
                            <SelectTrigger class="w-full">
                                <SelectValue placeholder="Filtre o valor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="avulso">Valor avulso</SelectItem>
                                    <SelectItem disabled value="pendente">Total pendente</SelectItem>
                                    <SelectItem disabled value="pago">Total pago</SelectItem>
                                    <SelectItem disabled value="total">Total fatura</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="md:col-span-12" v-show="criterio === 'avulso' && gateway">
                        <label class="block text-sm font-medium mb-1">
                            Valor da cobrança *
                        </label>
                        <Input v-model="valorAvulso" v-maska="moneyMaskOptions" type="text" placeholder="R$ 0,00" />
                    </div>
                    <div class="md:col-span-12" v-show="gateway">
                        <RadioGroup v-model="tipo" default-value="PIX" class="grid grid-cols-3">
                            <Label for="option-one"
                                class="flex items-center text-sm p-3 px-4 gap-2 bg-success/20 border rounded-lg cursor-pointer">
                                <RadioGroupItem id="option-one" value="PIX" class="bg-white" />
                                <i class="fa-brands fa-pix"></i>
                                PIX
                            </Label>
                            <Label for="option-two"
                                class="flex items-center text-sm p-3 px-4 gap-2 bg-primary/20 border rounded-lg cursor-pointer">
                                <RadioGroupItem id="option-two" value="LINK" class="bg-white" />
                                <i class="fa-solid fa-link"></i>
                                Link
                            </Label>
                            <Label for="option-three"
                                class="flex items-center text-sm p-3 px-4 gap-2 bg-body/70 border rounded-lg cursor-pointer">
                                <RadioGroupItem id="option-three" value="BOLETO" class="bg-white" />
                                <i class="fa-solid fa-file-invoice"></i>
                                Boleto
                            </Label>
                        </RadioGroup>
                    </div>
                    <div class="md:col-span-12" v-show="gateway && tipo === 'BOLETO'">
                        <label class="block text-sm font-medium mb-1">
                            Cliente * <a href="javascript:void(0)" @click="storeClientes.openSave"
                                class="text-blue-500 px-2 cursor-pointer">+ Novo</a>
                        </label>
                        <Select2Ajax id="clienteIdLancamento" v-model="clienteId" url="/clientes/select2" allowClear />
                    </div>
                    <div class="md:col-span-12 -my-2">
                        <hr class="mb-2">
                        <p class="text-xs text-muted-foreground text-center">Consulte as taxas de cobrança em cada
                            gateway, elas
                            variam e são diferentes para cada método de pagamento.</p>
                    </div>
                </div>
                <div class="md:col-span-12" v-else>
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Receipt />
                            </EmptyMedia>
                            <EmptyTitle>Cobrança gerada com sucesso!</EmptyTitle>
                            <EmptyDescription>
                                Copie o link e envie para o cliente.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Input v-model="linkPayment" class="text-xs" />
                            <div class="flex gap-2">
                                <Button @click="copiarLink" variant="default" class="text-white">
                                    <Copy />
                                    Copiar link
                                </Button>
                                <Button @click="acessarLink" variant="outline">
                                    <ExternalLink />
                                    Acessar
                                </Button>
                            </div>
                        </EmptyContent>
                    </Empty>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="storeCobranca.openModal = false">
                    Fechar
                </Button>
                <Button v-if="!linkExists" :disabled="loading" @click="gerarCobrancaLancamento" class="text-white"
                    type="button">
                    <FilePlus />
                    {{ submitText }}
                </Button>
                <Button v-else :disabled="loading" @click="resetModal" class="text-white" type="button">
                    <FilePlus />
                    Gerar outra
                </Button>
            </div>
        </div>
    </ModalView>
</template>
