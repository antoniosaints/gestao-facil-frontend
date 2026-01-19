<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    PackagePlus,
    Bot,
    BarChart3,
    MessageSquare,
    Zap,
    CheckCircle2,
    ShoppingCart,
    PlusCircle,
    MessageCircle,
    Trash
} from "lucide-vue-next"
import { formatCurrencyBR } from "@/utils/formatters"

// Mock de módulos
const modulos = ref([
    {
        id: 'ai-chat',
        nome: 'CORE IA',
        descricao: 'Chat inteligente que auxilia na sua produtividade.',
        detalhes: 'Utilize o poder da Inteligência Artificial para responder dúvidas frequentes, resolver problemas e otimizar processos.',
        preco: 9.90,
        icone: Bot,
        categoria: 'Chat Inteligente',
        ativo: true
    },
    {
        id: 'wpp-chat',
        nome: 'WhatsApp',
        descricao: 'Integração com o WhatsApp para envio de informativos aos seus clientes.',
        detalhes: 'Utilize o seu WhatsApp integrado ao sistema para facilitar a comunicação com seus clientes.',
        preco: 19.90,
        icone: MessageCircle,
        categoria: 'Notificações',
        ativo: false
    },
])

const moduloSelecionado = ref<any>(null)
const isDialogOpen = ref(false)

const abrirDetalhes = (modulo: any) => {
    moduloSelecionado.value = modulo
    isDialogOpen.value = true
}

const adicionarAoPlano = (modulo: any) => {
    // Lógica para chamar API e adicionar à mensalidade
    console.log(`Adicionando ${modulo.nome} ao plano...`)
    isDialogOpen.value = false
    // Toast de sucesso aqui
}
</script>

<template>
    <div class="space-y-6 p-2">
        <!-- Header da Store -->
        <div class="flex flex-col gap-2">
            <h2 class="text-2xl font-bold tracking-tight flex items-center gap-2">
                <PackagePlus class="w-8 h-8 text-primary" />
                App Store
            </h2>
            <p class="text-muted-foreground">
                Turbine seu ERP com recursos adicionais que se adaptam às necessidades do seu negócio.
            </p>
        </div>

        <!-- Grid de Módulos -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card v-for="modulo in modulos" :key="modulo.id"
                class="flex flex-col hover:border-primary/50 transition-all group border-2">
                <CardHeader>
                    <div class="flex justify-between items-start">
                        <div
                            class="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <component :is="modulo.icone" class="w-6 h-6" />
                        </div>
                        <Badge v-if="modulo.ativo" variant="secondary"
                            class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Ativo
                        </Badge>
                    </div>
                    <CardTitle class="mt-2">{{ modulo.nome }}</CardTitle>
                    <Badge variant="outline"
                        class="w-fit text-[10px] px-1 uppercase font-bold text-muted-foreground tracking-wider">
                        {{ modulo.categoria }}
                    </Badge>
                </CardHeader>

                <CardContent class="flex-grow -mt-2">
                    <p class="text-sm text-muted-foreground leading-relaxed">
                        {{ modulo.descricao }}
                    </p>
                    <div class="mt-2 flex items-baseline gap-1">
                        <span class="text-2xl font-bold text-primary">{{ formatCurrencyBR(modulo.preco) }}</span>
                        <span class="text-xs text-muted-foreground">/mês</span>
                    </div>
                </CardContent>

                <CardFooter class="border-t pt-4 -mt-2 bg-muted/5">
                    <Button v-if="!modulo.ativo" variant="default" class="w-full gap-2" @click="abrirDetalhes(modulo)">
                        <PlusCircle class="w-4 h-4" /> Detalhes e Assinar
                    </Button>
                    <Button v-else variant="outline" class="w-full gap-2" @click="abrirDetalhes(modulo)">
                        Gerenciar Módulo
                    </Button>
                </CardFooter>
            </Card>
        </div>

        <!-- Modal de Detalhes e Confirmação -->
        <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
            <DialogContent class="sm:max-w-[500px]">
                <DialogHeader v-if="moduloSelecionado">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="p-2 bg-primary/10 rounded-lg text-primary">
                            <component :is="moduloSelecionado.icone" class="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle class="text-xl">{{ moduloSelecionado.nome }}</DialogTitle>
                            <Badge variant="outline">{{ moduloSelecionado.categoria }}</Badge>
                        </div>
                    </div>
                    <DialogDescription class="pt-4 text-base text-gray-700 dark:text-gray-300">
                        {{ moduloSelecionado.detalhes }}
                    </DialogDescription>
                </DialogHeader>

                <div class="bg-muted/40 p-4 rounded-xl border-2 border-dashed border-primary/20 my-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-sm font-medium">Impacto na mensalidade:</p>
                            <p class="text-xs text-muted-foreground">Cobrado proporcionalmente até o próximo vencimento
                            </p>
                        </div>
                        <div class="text-right">
                            <span class="text-xl font-black text-primary">+ {{ formatCurrencyBR(moduloSelecionado?.preco
                                || 0) }}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter class="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" @click="isDialogOpen = false">Cancelar</Button>
                    <Button v-if="!moduloSelecionado.ativo" class="gap-2 px-8"
                        @click="adicionarAoPlano(moduloSelecionado)">
                        <ShoppingCart class="w-4 h-4" /> Confirmar Adição
                    </Button>
                    <Button variant="destructive" v-if="moduloSelecionado.ativo" class="gap-2 px-8">
                        <Trash class="w-4 h-4" /> Remover Módulo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<style scoped>
/* Transição suave para o card */
.transition-all {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>