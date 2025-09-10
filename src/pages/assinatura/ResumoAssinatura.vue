<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-vue-next"
import { onMounted, ref } from "vue"
import { useUiStore } from "@/stores/ui/uiStore"
import { ContaRepository, type StatusConta } from "@/repositories/conta-repository"
import { formatCurrencyBR } from "@/utils/formatters"
const storeUi = useUiStore();

const assinatura = ref<StatusConta>()

const faturas = ref()

async function getDataConta() {
    try {
        const response = await ContaRepository.status();
        assinatura.value = response.data
        faturas.value = response.data.faturas;
    } catch (error) {
        console.error(error);
    }
}

function pagarFatura(link: string) {
    window.open(link, "_blank");
}

onMounted(() => {
    getDataConta()
})
</script>

<template>
    <div class="max-w-7xl mx-auto space-y-4">
        <!-- Assinatura atual -->
        <Card class="border-primary shadow-lg">
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
            </CardContent>

            <CardFooter class="flex gap-2 justify-end">
                <Button variant="outline" class="text-white" @click="getDataConta">Atualizar</Button>
                <Button v-if="storeUi.status !== 'ATIVO'" variant="default" class="text-white">Renovar
                    Assinatura</Button>
            </CardFooter>
        </Card>

        <!-- Faturas -->
        <div>
            <h3 class="text-2xl font-bold mb-2">Minhas Faturas</h3>

            <div class="space-y-4 overflow-auto max-h-80">
                <Card v-for="fatura in faturas" :key="fatura.id" class="flex justify-between items-center p-4">
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
