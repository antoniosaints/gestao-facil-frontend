<template>
    <div class="max-w-7xl mx-auto p-4 space-y-6">
        <div v-if="loading" class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <div v-else-if="error" class="text-center text-red-500 font-medium">
            {{ error }}
        </div>

        <div v-else class="space-y-6">

            <!-- Header -->
            <Card>
                <CardHeader class="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <Avatar class="h-16 w-16 border bg-muted">
                        <AvatarFallback class="text-lg font-bold">{{ initials(stats?.cliente?.nome) }}</AvatarFallback>
                    </Avatar>
                    <div class="flex-1">
                        <CardTitle class="text-2xl font-bold">{{ stats?.cliente?.nome }}</CardTitle>
                        <div class="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" class="uppercase">{{ stats?.cliente?.tipo }}</Badge>
                        </div>
                    </div>
                    <Button variant="outline" @click="$router.push({ name: 'clientes-tabela' })">
                        Voltar para Lista
                    </Button>
                </CardHeader>
            </Card>

            <!-- Grid de Estatísticas -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                <!-- Vendas ou Compras -->
                <Card>
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium">
                            {{ stats?.cliente?.tipo === 'FORNECEDOR' ? 'Total Comprado' : 'Total em Vendas' }}
                        </CardTitle>
                        <ShoppingCartIcon class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">
                            {{ formatCurrency(stats?.cliente?.tipo === 'FORNECEDOR' ? stats?.compras?.total :
                                stats?.vendas?.total) }}
                        </div>
                        <p class="text-xs text-muted-foreground">
                            {{ stats?.cliente?.tipo === 'FORNECEDOR' ? stats?.compras?.quantidade :
                                stats?.vendas?.quantidade }} operações registradas
                        </p>
                    </CardContent>
                </Card>

                <!-- Lucro (Apenas Clientes) -->
                <Card v-if="stats?.cliente?.tipo !== 'FORNECEDOR'">
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium">Lucro Estimado</CardTitle>
                        <TrendingUpIcon class="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-emerald-600">
                            {{ formatCurrency(stats?.vendas?.lucroEstimado) }}
                        </div>
                        <p class="text-xs text-muted-foreground">Baseado no custo de estoque</p>
                    </CardContent>
                </Card>

                <!-- Ordens de Serviço -->
                <Card>
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium">Ordens de Serviço</CardTitle>
                        <WrenchIcon class="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold">{{ formatCurrency(stats?.os?.total) }}</div>
                        <p class="text-xs text-muted-foreground">
                            {{ stats?.os?.quantidade }} serviços finalizados
                        </p>
                    </CardContent>
                </Card>

                <!-- Financeiro Pendente -->
                <Card>
                    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle class="text-sm font-medium">Pendente</CardTitle>
                        <AlertCircleIcon class="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div class="text-2xl font-bold text-yellow-600">
                            {{ formatCurrency(stats?.financeiro?.pendenteReceber - stats?.financeiro?.pendentePagar) }}
                        </div>
                        <div class="text-xs text-muted-foreground mt-1">
                            <span class="text-green-600">Receber: {{ formatCurrency(stats?.financeiro?.pendenteReceber)
                            }}</span>
                            <span class="mx-1">|</span>
                            <span class="text-red-600">Pagar: {{ formatCurrency(stats?.financeiro?.pendentePagar)
                            }}</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ShoppingCart as ShoppingCartIcon,
    Wrench as WrenchIcon,
    TrendingUp as TrendingUpIcon,
    AlertCircle as AlertCircleIcon
} from 'lucide-vue-next'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const stats = ref<any>(null)

function formatCurrency(value: any) {
    if (!value && value !== 0) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}

function initials(name: string) {
    return name ? name.substring(0, 2).toUpperCase() : '??'
}

onMounted(async () => {
    try {
        const id = Number(route.params.id)
        if (!id) throw new Error("ID inválido")
        stats.value = await ClienteRepository.getStats(id)
    } catch (e: any) {
        console.error(e)
        error.value = "Falha ao carregar estatísticas"
    } finally {
        loading.value = false
    }
})
</script>
