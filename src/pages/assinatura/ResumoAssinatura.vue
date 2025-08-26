<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-vue-next"
import { ref } from "vue"

const assinaturaAtual = ref({
    plano: "Pro",
    preco: "R$ 70/mês",
    inicio: "01/08/2025",
    renovacao: "01/09/2025",
    status: "Ativa",
})

const faturas = ref([
    { id: 1, valor: "R$ 70,00", vencimento: "01/08/2025", status: "Paga" },
    { id: 2, valor: "R$ 70,00", vencimento: "01/09/2025", status: "Pendente" },
    { id: 3, valor: "R$ 70,00", vencimento: "01/10/2025", status: "Pendente" },
])
</script>

<template>
    <div class="max-w-7xl mx-auto py-4 px-4 space-y-4">
        <!-- Assinatura atual -->
        <Card class="border-primary shadow-lg">
            <CardHeader>
                <CardTitle class="flex justify-between items-center">
                    Plano Atual: {{ assinaturaAtual.plano }}
                    <Badge variant="outline" class="text-green-600 border-green-600">
                        {{ assinaturaAtual.status }}
                    </Badge>
                </CardTitle>
                <CardDescription>Seu plano está ativo e será renovado automaticamente.</CardDescription>
            </CardHeader>

            <CardContent class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-muted-foreground">Preço</p>
                    <p class="text-lg font-semibold">{{ assinaturaAtual.preco }}</p>
                </div>
                <div>
                    <p class="text-sm text-muted-foreground">Início</p>
                    <p class="text-lg font-semibold">{{ assinaturaAtual.inicio }}</p>
                </div>
                <div>
                    <p class="text-sm text-muted-foreground">Próxima renovação</p>
                    <p class="text-lg font-semibold">{{ assinaturaAtual.renovacao }}</p>
                </div>
            </CardContent>

            <CardFooter>
                <Button variant="destructive" class="w-full">Cancelar Assinatura</Button>
            </CardFooter>
        </Card>

        <!-- Faturas -->
        <div>
            <h3 class="text-2xl font-bold mb-2">Minhas Faturas</h3>

            <div class="space-y-4 overflow-auto max-h-80">
                <Card v-for="fatura in faturas" :key="fatura.id" class="flex justify-between items-center p-4">
                    <div>
                        <p class="text-lg font-semibold">{{ fatura.valor }}</p>
                        <p class="text-sm text-muted-foreground">Vencimento: {{ fatura.vencimento }}</p>
                    </div>

                    <div class="flex items-center gap-3">
                        <Badge v-if="fatura.status === 'Paga'" class="bg-green-100 text-green-700">
                            <CheckCircle class="w-4 h-4 mr-1" /> Paga
                        </Badge>
                        <Badge v-else-if="fatura.status === 'Pendente'" class="bg-yellow-100 text-yellow-700">
                            <Clock class="w-4 h-4 mr-1" /> Pendente
                        </Badge>
                        <Badge v-else class="bg-red-100 text-red-700">
                            <XCircle class="w-4 h-4 mr-1" /> Cancelada
                        </Badge>

                        <Button class="text-white" v-if="fatura.status === 'Pendente'" size="sm"
                            @click="console.log('Pagar fatura', fatura.id)">
                            Pagar
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    </div>
</template>
