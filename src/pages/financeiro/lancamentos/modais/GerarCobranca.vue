<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { moneyMaskOptions } from '@/lib/imaska'
import { CircleAlert, Copy, ExternalLink, FilePlus, Loader2, Receipt } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { vMaska } from "maska/vue"
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { useClientesStore } from '@/stores/clientes/useClientes'
import { useCobrancasFinanceirasStore } from '@/stores/lancamentos/useCobrancas'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { addHours, isBefore } from 'date-fns'
import { Textarea } from '@/components/ui/textarea'
import { useUiStore } from '@/stores/ui/uiStore'
import { ContaRepository } from '@/repositories/conta-repository'

const storeCobranca = useCobrancasFinanceirasStore()
const storeClientes = useClientesStore()
const uiStore = useUiStore()
const toast = useToast()
const submitText = ref('Gerar cobrança')
const linkPayment = ref('')
const mercadoPagoAtivo = ref(false)
const verificandoMercadoPago = ref(false)

async function carregarStatusMercadoPago() {
    verificandoMercadoPago.value = true
    mercadoPagoAtivo.value = false
    storeCobranca.form.gateway = undefined

    try {
        const status = await ContaRepository.statusMercadoPago()
        mercadoPagoAtivo.value = status.modo !== 'NENHUM'
        if (mercadoPagoAtivo.value) storeCobranca.form.gateway = 'mercadopago'
    } catch (error) {
        console.error(error)
        toast.error('Não foi possível verificar a integração com o Mercado Pago.')
    } finally {
        verificandoMercadoPago.value = false
    }
}

async function gerarCobrancaLancamento() {
    try {
        if (!mercadoPagoAtivo.value) {
            return toast.error('Conecte o Mercado Pago antes de gerar uma cobrança.')
        }
        if (!storeCobranca.form.gateway) return toast.error('Gateway de pagamento nao informado!', {
            timeout: 5000
        })
        if (storeCobranca.form.criterio === "avulso" && !storeCobranca.form.valor) return toast.error('Informe o valor da cobrança.', {
            timeout: 5000
        })

        if (isBefore(storeCobranca.form.vencimento, addHours(new Date(), 23))) {
            return toast.error('A data de vencimento deve ser mais de um dia.', { timeout: 5000 })
        }

        if (storeCobranca.form.tipo === "BOLETO") {
            if (!storeCobranca.form.clienteId) {
                return toast.error('Informe o cliente para gerar o boleto.', {
                    timeout: 5000
                })
            }
            if (Number(storeCobranca.form.valor.replace(",", ".")) < 4) {
                return toast.error('O valor mínimo para boleto é R$ 4,00', {
                    timeout: 5000
                })
            }
        }
        storeCobranca.form.loading = true
        submitText.value = 'Gerando cobrança...'
        const response = await LancamentosRepository.gerarCobranca(storeCobranca.form.tipo, Number(storeCobranca.form.valor), storeCobranca.form.gateway, storeCobranca.form.clienteId, storeCobranca.vinculoCobranca)
        linkPayment.value = response.data?.paymentLink || response.message
        storeCobranca.form.linkExists = true
        toast.success('Cobrança gerada com sucesso.', {
            timeout: 5000
        })
        storeCobranca.vinculoCobranca = undefined;
        storeCobranca.form.loading = false
        submitText.value = 'Gerar cobrança'
        storeCobranca.updateTable()
    } catch (error: any) {
        console.log(error)
        toast.error(error.response?.data?.message || 'Erro ao gerar cobrança', {
            timeout: 5000
        })
        storeCobranca.form.loading = false
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

watch(
    () => uiStore.canCreateCharge,
    (enabled) => {
        if (enabled) return
        storeCobranca.openModal = false
    },
    { immediate: true },
)

watch(
    () => storeCobranca.openModal,
    (open) => {
        if (open) void carregarStatusMercadoPago()
    },
)

</script>

<template>
    <ModalView v-model:open="storeCobranca.openModal" title="Gerar cobrança" size="lg"
        description="Gerar uma cobrança de pagamento">
        <div class="grid gap-4 px-4">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div class="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-4"
                    v-if="!storeCobranca.form.linkExists">
                    <div class="md:col-span-6">
                        <label class="block text-sm font-medium mb-1">
                            Gateway
                        </label>
                        <div v-if="verificandoMercadoPago"
                            class="flex h-10 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
                            <Loader2 class="h-4 w-4 animate-spin" />
                            Verificando Mercado Pago...
                        </div>
                        <div v-else-if="mercadoPagoAtivo"
                            class="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium">
                            Mercado Pago
                        </div>
                        <div v-else
                            class="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                            <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
                            Conecte o Mercado Pago em Apps para gerar cobranças.
                        </div>
                    </div>
                    <div class="md:col-span-6">
                        <label class="block text-sm font-medium mb-1">
                            Vencimento
                        </label>
                        <Calendarpicker :required="true" :teleport="true" v-model="storeCobranca.form.vencimento" />
                    </div>
                    <div class="md:col-span-12"
                        v-show="storeCobranca.form.criterio === 'avulso' && mercadoPagoAtivo">
                        <label class="block text-sm font-medium mb-1">
                            Valor da cobrança *
                        </label>
                        <Input v-model="storeCobranca.form.valor" v-maska="moneyMaskOptions" type="text"
                            placeholder="R$ 0,00" />
                    </div>
                    <div class="md:col-span-12"
                        v-show="storeCobranca.form.criterio === 'avulso' && mercadoPagoAtivo">
                        <label class="block text-sm font-medium mb-1">
                            Observação
                        </label>
                        <Textarea v-model="storeCobranca.form.observacao" placeholder="Observação" />
                    </div>
                    <div class="md:col-span-12" v-show="mercadoPagoAtivo">
                        <RadioGroup v-model="storeCobranca.form.tipo" default-value="PIX" class="grid grid-cols-3">
                            <Label for="option-one"
                                class="flex items-center text-sm p-3 px-4 gap-2 bg-success/20 border rounded-lg cursor-pointer">
                                <RadioGroupItem id="option-one" value="PIX" class="bg-white" />
                                <i class="fa-brands fa-pix"></i>
                                PIX
                            </Label>
                            <Label for="option-three"
                                class="flex items-center text-sm p-3 px-4 gap-2 bg-body/70 border rounded-lg cursor-pointer">
                                <RadioGroupItem id="option-three" value="BOLETO" class="bg-white" />
                                <i class="fa-solid fa-file-invoice"></i>
                                Boleto
                            </Label>
                            <Label for="option-two"
                                class="flex items-center text-sm p-3 px-4 gap-2 bg-primary/20 border rounded-lg cursor-pointer">
                                <RadioGroupItem id="option-two" value="LINK" class="bg-white" />
                                <i class="fa-solid fa-link"></i>
                                Link
                            </Label>
                        </RadioGroup>
                    </div>
                    <div class="md:col-span-12"
                        v-show="mercadoPagoAtivo && storeCobranca.form.tipo === 'BOLETO'">
                        <label class="block text-sm font-medium mb-1">
                            Cliente * <a href="javascript:void(0)" @click="storeClientes.openSave"
                                class="text-blue-500 px-2 cursor-pointer">+ Novo</a>
                        </label>
                        <Select2Ajax id="clienteIdLancamento" v-model="storeCobranca.form.clienteId"
                            url="/clientes/select2" allowClear />
                    </div>
                    <div v-if="mercadoPagoAtivo" class="md:col-span-12 -my-2">
                        <hr class="mb-2">
                        <p v-if="storeCobranca.form.tipo === 'LINK'"
                            class="text-xs text-muted-foreground text-center">
                            A cobrança será registrada e vinculada automaticamente quando o Mercado Pago informar a criação do pagamento.
                        </p>
                        <p v-else class="text-xs text-muted-foreground text-center">Consulte as taxas de
                            cobrança {{ storeCobranca.form.tipo }} em cada
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
                <Button v-if="!storeCobranca.form.linkExists"
                    :disabled="storeCobranca.form.loading || verificandoMercadoPago || !mercadoPagoAtivo"
                    @click="gerarCobrancaLancamento" class="text-white" type="button">
                    <FilePlus />
                    {{ submitText }}
                </Button>
                <Button v-else :disabled="storeCobranca.form.loading" @click="storeCobranca.reset" class="text-white"
                    type="button">
                    <FilePlus />
                    Gerar outra
                </Button>
            </div>
        </div>
    </ModalView>
</template>
