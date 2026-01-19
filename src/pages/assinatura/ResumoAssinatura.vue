<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, BadgeDollarSign, CreditCard, RotateCw, Sparkles, FileCheck2, CircleDollarSign, Menu } from "lucide-vue-next"
import { onMounted, ref } from "vue"
import { useUiStore } from "@/stores/ui/uiStore"
import { ContaRepository, type StatusConta } from "@/repositories/conta-repository"
import { formatCurrencyBR } from "@/utils/formatters"
import { useToast } from "vue-toastification"
const storeUi = useUiStore();
const toast = useToast()

const assinatura = ref<StatusConta>()
const renewText = ref("Renovar assinatura")
const refresh = ref(false)
const generatingLink = ref(false)

const faturas = ref<any[]>()

async function getDataConta() {
    try {
        refresh.value = true
        const response = await storeUi.getStatus()
        assinatura.value = response!
        faturas.value = response?.faturas;
        refresh.value = false
    } catch (error) {
        console.error(error);
        refresh.value = false
    }
}

async function renovarAssinatura() {
    try {
        renewText.value = "Gerando link..."
        generatingLink.value = true
        const response = await ContaRepository.gerarLink();
        window.location.href = response.link;
        renewText.value = "Redirecionando..."
        toast.success("Link gerado com sucesso")
    } catch (error) {
        console.error(error);
        renewText.value = "Renovar assinatura"
        generatingLink.value = false
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

function abrirComprovante(link: string) {
    window.open(link, "_blank");
}

onMounted(() => {
    getDataConta()
})
</script>

<template>
    <div class="max-w-7xl mx-auto space-y-6">
        <!-- Dashboard de Assinatura -->
        <Card class="border shadow-sm overflow-hidden">
            <CardHeader class="pb-4">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <CardTitle class="flex items-center gap-2 text-xl font-bold tracking-tight">
                            <Sparkles class="w-5 h-5 text-primary" />
                            Gestão Fácil Pro
                        </CardTitle>
                        <CardDescription>Gerencie seu plano e pagamentos da assinatura</CardDescription>
                    </div>
                    <Badge :variant="storeUi.status === 'ATIVO' ? 'default' : 'destructive'"
                        class="px-4 py-1 uppercase tracking-wider font-bold">
                        {{ storeUi.status }}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent class="pt-6">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div class="space-y-1">
                        <span class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                            <CircleDollarSign class="w-3 h-3" /> Valor Mensal
                        </span>
                        <p class="text-2xl font-bold text-primary dark:text-blue-400">
                            {{ assinatura?.valor || 'R$ 0,00' }}
                        </p>
                    </div>

                    <div class="space-y-1">
                        <span class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                            <Clock class="w-3 h-3" /> Vencimento
                        </span>
                        <p class="text-lg font-semibold">{{ assinatura?.proximoVencimento }}</p>
                    </div>

                    <div class="space-y-1">
                        <span class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                            <RotateCw class="w-3 h-3" /> Dias Restantes
                        </span>
                        <div class="flex items-center gap-2">
                            <p class="text-lg font-semibold"
                                :class="assinatura?.diasParaVencer! <= 5 ? 'text-destructive' : ''">
                                {{ Math.max(assinatura?.diasParaVencer || 0, 0).toFixed(0) }} dias
                            </p>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <span class="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                            <FileCheck2 class="w-3 h-3" /> Total Faturas
                        </span>
                        <p class="text-lg font-semibold">{{ faturas?.length || 0 }}</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter class="bg-muted/10 p-4 flex gap-3 justify-end">
                <Button variant="outline" size="sm" @click="getDataConta" :disabled="refresh">
                    <RotateCw class="w-4 h-4 mr-2" :class="refresh ? 'animate-spin' : ''" />
                    Atualizar
                </Button>

                <Button v-if="storeUi.diasParaVencer <= 3 && !assinatura?.proximoLinkPagamento" size="sm"
                    @click="renovarAssinatura" :disabled="generatingLink">
                    <CreditCard class="w-4 h-4 mr-2" /> {{ renewText }}
                </Button>

                <Button v-if="assinatura?.proximoLinkPagamento" size="sm" variant="default"
                    class="bg-orange-500 hover:bg-orange-600 text-white" @click="abrirLinkPagamento">
                    <BadgeDollarSign class="w-4 h-4 mr-2" /> Pagar Próxima
                </Button>
            </CardFooter>
        </Card>

        <!-- Lista de Faturas Compacta -->
        <Card class="border shadow-sm">
            <CardHeader class="pb-2">
                <CardTitle class="text-lg font-bold">Histórico de Faturas</CardTitle>
            </CardHeader>
            <CardContent>
                <div class="rounded-md border overflow-hidden">
                    <div v-if="!faturas || faturas.length === 0" class="p-8 text-center text-muted-foreground">
                        Nenhuma fatura encontrada.
                    </div>

                    <div v-else class="divide-y">
                        <!-- Cabeçalho Simulado -->
                        <div
                            class="grid grid-cols-4 md:grid-cols-5 bg-muted/50 p-3 text-xs font-bold uppercase text-muted-foreground">
                            <span>Descrição</span>
                            <span class="text-center">Valor</span>
                            <span class="hidden md:block">Vencimento</span>
                            <span class="text-center md:text-left">Status</span>
                            <span class="text-right">Ações</span>
                        </div>

                        <!-- Linhas da "Tabela" -->
                        <div v-for="fatura in faturas?.slice(0, 10)" :key="fatura.id"
                            class="grid grid-cols-4 md:grid-cols-5 p-3 items-center hover:bg-muted/30 transition-colors">
                            <div class="text-sm text-muted-foreground">
                                Pagamento de mensalidade
                            </div>

                            <div class="flex flex-col">
                                <span class="font-bold text-sm text-center">
                                    {{ formatCurrencyBR(fatura.valor) }}
                                </span>
                            </div>

                            <div class="hidden md:block text-sm text-muted-foreground">
                                {{ fatura.vencimento }}
                            </div>

                            <div>
                                <Badge v-if="fatura.status === 'PAGO'" variant="outline"
                                    class="bg-emerald-50 text-emerald-700 border-success/40 dark:bg-emerald-900/20 dark:text-emerald-400 gap-1">
                                    <CheckCircle class="w-3 h-3" /> <span class="hidden sm:inline">Paga</span>
                                </Badge>
                                <Badge v-else-if="fatura.status === 'PENDENTE'" variant="outline"
                                    class="bg-amber-50 text-amber-700 border-warning/40 dark:bg-amber-900/20 dark:text-amber-400 gap-1">
                                    <Clock class="w-3 h-3" /> <span class="hidden sm:inline">Pendente</span>
                                </Badge>
                                <Badge v-else variant="outline"
                                    class="bg-red-50 dark:bg-red-900/20 text-red-700 border-danger/40 dark:text-red-400 gap-1">
                                    <XCircle class="w-3 h-3" /> <span class="hidden sm:inline">Cancelada</span>
                                </Badge>
                            </div>

                            <div class="flex justify-end gap-2">
                                <Button v-if="fatura.status === 'PAGO'" variant="ghost" size="icon"
                                    class="h-8 w-8 text-blue-500" title="Ver Comprovante"
                                    @click="abrirComprovante(fatura.linkPagamento)">
                                    <FileCheck2 class="w-4 h-4" />
                                </Button>

                                <Button v-if="fatura.status === 'PENDENTE'" size="sm" class="h-8 px-3"
                                    @click="pagarFatura(fatura.linkPagamento)">
                                    <CircleDollarSign class="w-4 h-4 mr-1" /> Pagar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <p class="text-[11px] text-muted-foreground mt-4 italic">* Exibindo as últimas 10 faturas.</p>
            </CardContent>
        </Card>

        <!-- Menu Mobile (Espaçador para não cobrir conteúdo) -->
        <div class="h-20 md:hidden"></div>

        <nav v-if="storeUi.isMobile"
            class="fixed bottom-0 left-0 w-full bg-background border-t flex justify-around items-center h-16 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
            <button @click="storeUi.openSidebar = true"
                class="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary">
                <Menu class="w-5 h-5" />
                <span class="text-[10px] font-medium">Menu</span>
            </button>
        </nav>
    </div>
</template>