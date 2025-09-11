<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, BadgeDollarSign, CreditCard, RotateCw } from "lucide-vue-next"
import { onMounted, ref } from "vue"
import { useUiStore } from "@/stores/ui/uiStore"
import { ContaRepository, type StatusConta } from "@/repositories/conta-repository"
import { formatCurrencyBR } from "@/utils/formatters"
import { useToast } from "vue-toastification"
import type { FaturasContas } from "@/types/schemas"
const storeUi = useUiStore();
const toast = useToast()

const assinatura = ref<StatusConta>()
const renewText = ref("Renovar assinatura")

const faturas = ref<any[]>()

async function getDataConta() {
    try {
        const response = await ContaRepository.status();
        assinatura.value = response.data
        faturas.value = response.data.faturas;
    } catch (error) {
        console.error(error);
    }
}

async function renovarAssinatura() {
    try {
        renewText.value = "Gerando link..."
        const response = await ContaRepository.gerarLink();
        window.open(response.link, "_blank");
        renewText.value = "Renovar assinatura"
        toast.success("Link gerado com sucesso")
    } catch (error) {
        console.error(error);
        toast.error("Erro ao gerar o link")
    }
}

function pagarFatura(link: string) {
    window.open(link, "_blank");
}

function abrirLinkPagamento() {
    if (assinatura.value?.proximoLinkPagamento) {
        window.open(assinatura.value.proximoLinkPagamento, "_blank");
    }
}

onMounted(() => {
    getDataConta()
})
</script>

<template>
    <div class="max-w-7xl mx-auto space-y-4">
        <!-- Assinatura atual -->
        <Card class="border shadow-lg">
            <CardHeader>
                <CardTitle class="flex justify-between items-center text-xl">
                    Assinatura Gestão Fácil
                    <Badge variant="outline" :class="storeUi.status === 'ATIVO' ? 'bg-success' : 'bg-danger'">
                        {{ storeUi.status }}
                    </Badge>
                </CardTitle>
                <CardDescription>Assinatura atual do ERP Gestão Fácil</CardDescription>
            </CardHeader>

            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-muted-foreground">Preço</p>
                    <p class="text-lg font-semibold">{{ assinatura?.valor }}</p>
                </div>
                <div>
                    <p class="text-sm text-muted-foreground">Próximo vencimento</p>
                    <p class="text-lg font-semibold">{{ assinatura?.proximoVencimento }}</p>
                </div>
                <div>
                    <p class="text-sm text-muted-foreground">Faturas geradas</p>
                    <p class="text-lg font-semibold">{{ assinatura?.faturas.length }}</p>
                </div>
                <div>
                    <p class="text-sm text-muted-foreground">Dias até o vencimento</p>
                    <p class="text-lg font-semibold">{{ Math.max(assinatura?.diasParaVencer || 0, 0).toFixed(0) }}</p>
                </div>
            </CardContent>

            <CardFooter class="flex gap-2 justify-end">
                <Button variant="outline" class="text-white" @click="getDataConta"><RotateCw /> Atualizar</Button>
                <Button v-if="storeUi.status !== 'ATIVO' && assinatura?.proximoLinkPagamento == null" @click="renovarAssinatura" variant="default" class="text-white"><CreditCard /> {{ renewText }}</Button>
                <Button v-if="storeUi.status !== 'ATIVO' && assinatura?.proximoLinkPagamento" @click="abrirLinkPagamento" variant="default" class="text-white bg-warning"><BadgeDollarSign /> Pagar agora</Button>
            </CardFooter>
        </Card>

        <!-- Faturas -->
        <div>
            <h3 class="text-2xl font-bold mb-2">Minhas Faturas</h3>

            <div class="space-y-4 overflow-auto max-h-80">
                <Card v-for="fatura in faturas?.slice(0, 10)" :key="fatura.id" class="flex justify-between items-center p-4">
                    <div>
                        <p class="text-lg font-semibold">{{ formatCurrencyBR(parseFloat(fatura.valor.replace(',', '.')))
                        }}</p>
                        <p class="text-sm text-muted-foreground">Vencimento: {{ fatura.vencimento }}</p>
                    </div>

                    <div class="flex items-center gap-3">
                        <span v-if="fatura.status === 'PAGO'" class="px-2 py-1 rounded-md flex items-center bg-success">
                            <CheckCircle class="w-4 h-4 mr-1" /> Paga
                        </span>
                        <span v-else-if="fatura.status === 'PENDENTE'"
                            class="px-2 py-1 rounded-md flex items-center bg-warning">
                            <Clock class="w-4 h-4 mr-1" /> Pendente
                        </span>
                        <span v-else class="px-2 py-1 rounded-md flex items-center bg-danger">
                            <XCircle class="w-4 h-4 mr-1" /> Cancelada
                        </span>

                        <Button class="text-white" v-if="fatura.status === 'PENDENTE'"
                            @click="pagarFatura(fatura.linkPagamento)">
                            Pagar
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    </div>
</template>
