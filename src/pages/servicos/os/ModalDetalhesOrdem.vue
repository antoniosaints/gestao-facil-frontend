<template>
    <ModalView v-model:open="store.openModalDetalheOs" size="3xl" title="Detalhes da OS"
        description="Informações sobre a ordem de serviço">
        <div v-if="!store.ordemDetalhe" class="flex flex-col gap-3 px-4 h-full items-center justify-center">
            <LoaderIcon class="h-12 w-12 text-primary animate-spin" />
            <p>Carregando detalhes da ordem de serviço...</p>
        </div>
        <div v-if="store.ordemDetalhe" class="flex flex-col gap-3 px-4">
            <Tabs v-model:default-value="activeTab">
                <div class="overflow-auto max-w-full">
                    <TabsList class="bg-gray-200 dark:bg-gray-700 rounded-lg grid w-max grid-cols-4">
                        <TabsTrigger value="geral">
                            <Info class="inline-flex mr-1 w-4 h-4" /> Geral
                        </TabsTrigger>
                        <!-- <TabsTrigger value="arquivos">
                            <FileSymlink class="inline-flex mr-1 w-4 h-4" /> Arquivos
                        </TabsTrigger> -->
                        <TabsTrigger value="mensagens">
                            <MessageCircleMore class="inline-flex mr-1 w-4 h-4" />Mensagens
                        </TabsTrigger>
                        <TabsTrigger value="produtos">
                            <Box class="inline-flex mr-1 w-4 h-4" />Produtos
                        </TabsTrigger>
                        <TabsTrigger value="servicos">
                            <FilePlus class="inline-flex mr-1 w-4 h-4" />Serviços
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="geral" class="mt-3">
                    <div class="grid grid-cols-2 gap-4 px-2">
                        <div>
                            <p><strong class="text-muted-foreground font-normal">Cliente:</strong>
                                {{ store.ordemDetalhe.Cliente.nome }}</p>
                            <p><strong class="text-muted-foreground font-normal">Telefone:</strong>
                                {{ store.ordemDetalhe.Cliente.telefone || '—' }}</p>
                            <p><strong class="text-muted-foreground font-normal">Data de abertura:</strong>
                                {{ format(store.ordemDetalhe.data, 'dd/MM/yyyy') || '—' }}
                            </p>
                            <p><strong class="text-muted-foreground font-normal">Desconto:</strong>
                                {{ store.ordemDetalhe.desconto || '—' }}</p>
                        </div>
                        <div>
                            <p><strong class="text-muted-foreground font-normal">Total:</strong>
                                {{formatMoney(store.ordemDetalhe.ItensOrdensServico.reduce((a,
                                    b) => a + b.quantidade * b.valor, 0) || 0)}}</p>
                            <p><strong class="text-muted-foreground font-normal">Desconto:</strong> {{
                                formatMoney(store.ordemDetalhe.desconto || 0) }}</p>
                            <p><strong class="text-muted-foreground font-normal">Total Final:</strong>
                                {{formatMoney(store.ordemDetalhe.ItensOrdensServico.reduce((a, b) => a + b.quantidade *
                                    b.valor, 0) - store.ordemDetalhe.desconto || 0)}}
                            </p>
                            <p><strong class="text-muted-foreground font-normal">Responsável:</strong>
                                {{ store.ordemDetalhe.Operador.nome || '—' }}</p>
                        </div>
                    </div>
                    <hr class="mx-2 mt-2">
                    <div class="mt-3 px-2">
                        <p><strong class="text-muted-foreground font-normal">Descrição técnica:</strong>
                            {{ store.ordemDetalhe.descricao || '—' }}</p>
                        <p><strong class="text-muted-foreground font-normal">Descrição cliente:</strong>
                            {{ store.ordemDetalhe.descricaoCliente || '—' }}</p>
                    </div>
                </TabsContent>
                <TabsContent value="arquivos" class="mt-3">
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center gap-2">
                            <input ref="fileInput" type="file" multiple @change="handleFiles" class="hidden" />
                            <Button size="sm" @click="() => fileInput?.click()">Enviar arquivos</Button>
                            <Button size="sm" variant="outline" @click="downloadSelected"
                                :disabled="!selectedFiles.length">Baixar selecionados</Button>
                            <Button size="sm" variant="destructive" @click="removeSelected"
                                :disabled="!selectedFiles.length">Remover</Button>
                        </div>

                        <div class="overflow-auto max-h-64 border rounded-md p-2">
                            <ul class="divide-y">
                                <li v-for="file in arquivos" :key="file.id"
                                    class="flex items-center justify-between py-2">
                                    <label class="flex items-center gap-3">
                                        <input type="checkbox" v-model="selectedFiles" :value="file.id" />
                                        <div>
                                            <div class="font-medium">{{ file.nome }}</div>
                                            <div class="text-xs text-muted-foreground">
                                                {{ file.tamanhoFormatado }} •
                                                {{ file.uploadedAt }}
                                            </div>
                                        </div>
                                    </label>
                                    <div class="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" @click="preview(file)">Visualizar</Button>
                                        <Button size="icon" variant="outline" @click="download(file)">Baixar</Button>
                                    </div>
                                </li>
                                <li v-if="!arquivos.length" class="py-6 text-center text-sm text-muted-foreground">Sem
                                    arquivos.</li>
                            </ul>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="mensagens" class="mt-3">
                    <div class="flex flex-col gap-3">
                        <div class="overflow-auto max-h-60 border rounded-md p-3">
                            <ul class="flex flex-col-reverse">
                                <li v-for="msg in store.ordemDetalhe.MensagensInteracoesOrdemServico" :key="msg.id"
                                    class="px-4 bg-gray-100 dark:bg-gray-800 py-2 rounded-lg border">
                                    <div class="text-sm flex items-center justify-between">
                                        <span class="flex gap-2 items-center">
                                            <strong>{{ msg.Autor?.nome }}</strong>
                                            <span class="text-xs text-muted-foreground">•
                                                {{ formatToCapitalize(msg.tipo) }}
                                            </span>
                                        </span>
                                        <span class="text-xs text-muted-foreground">
                                            {{ format(msg.data, 'dd/MM/yyyy HH:mm') }}
                                        </span>
                                    </div>
                                    <div class="mt-1 text-sm">
                                        {{ msg.mensagem }}
                                    </div>
                                </li>
                                <li v-if="!store.ordemDetalhe.MensagensInteracoesOrdemServico.length"
                                    class="py-6 text-center text-sm text-muted-foreground">Sem
                                    mensagens.</li>
                            </ul>
                        </div>

                        <div class="flex gap-2">
                            <Input v-model="novaMensagem" placeholder="Escreva uma mensagem..." class="flex-1"
                                rows="3" />
                            <Button class="text-white" @click="enviarMensagem"
                                :disabled="!novaMensagem.trim()">Enviar</Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="produtos" class="mt-3">
                    <div class="flex flex-col gap-3">
                        <div class="overflow-auto max-h-64 border rounded-md p-3">
                            <div class="grid grid-cols-1 gap-3">
                                <div v-for="p in store.ordemDetalhe.ItensOrdensServico.filter(p => p.tipo === 'PRODUTO')"
                                    :key="p.id"
                                    class="flex items-center gap-3 border rounded-lg p-3 hover:bg-muted/40 transition">
                                    <div class="w-14 h-14 rounded-full overflow-hidden shadow-sm">
                                        <img :src="'/imgs/logo.png'" :alt="'IMG'" class="w-full h-full object-cover" />
                                    </div>

                                    <div class="flex-1 flex flex-col">
                                        <div class="font-semibold text-sm">{{ p.itemName }}</div>
                                        <div class="text-xs text-muted-foreground">Valor: {{ formatMoney(p.valor) }} x
                                            {{ p.quantidade }}
                                        </div>
                                        <div class="text-sm font-medium mt-1">
                                            Subtotal: {{ formatMoney(p.quantidade * p.valor) }}
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-2 self-center">
                                        <!-- <Button size="sm" variant="link" @click="preview(p)">Visualizar</Button> -->
                                        <Button size="sm" variant="outline">
                                            <Eye />
                                            Visualizar
                                        </Button>
                                    </div>
                                </div>

                                <div v-if="!store.ordemDetalhe.ItensOrdensServico.filter(p => p.tipo === 'PRODUTO').length"
                                    class="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                    <Box class="h-10 w-10" />
                                    Sem produtos.
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="servicos" class="mt-3">
                    <div class="flex flex-col gap-3">
                        <div class="overflow-auto max-h-64 border rounded-md p-3">
                            <div class="grid grid-cols-1 gap-3">
                                <div v-for="p in store.ordemDetalhe.ItensOrdensServico.filter(p => p.tipo === 'SERVICO')"
                                    :key="p.id"
                                    class="flex items-center gap-3 border rounded-lg p-3 hover:bg-muted/40 transition">
                                    <div class="w-14 h-14 rounded-full overflow-hidden shadow-sm">
                                        <img :src="'/imgs/logo.png'" :alt="'IMG'" class="w-full h-full object-cover" />
                                    </div>

                                    <div class="flex-1 flex flex-col">
                                        <div class="font-semibold text-sm">{{ p.itemName }}</div>
                                        <div class="text-xs text-muted-foreground">Valor: {{ formatMoney(p.valor) }} x
                                            {{ p.quantidade }}
                                        </div>
                                        <div class="text-sm font-medium mt-1">
                                            Subtotal: {{ formatMoney(p.quantidade * p.valor) }}
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-2 self-center">
                                        <!-- <Button size="sm" variant="link" @click="preview(p)">Visualizar</Button> -->
                                        <Button size="sm" variant="outline">
                                            <Eye />
                                            Visualizar
                                        </Button>
                                    </div>
                                </div>

                                <div v-if="!servicos.length"
                                    class="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                                    <FileDigit class="h-10 w-10" />
                                    Sem serviços.
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <div class="flex justify-end gap-2 mt-4 px-4">
            <Button type="button" variant="secondary" @click="store.openModalDetalheOs = false">
                <OctagonX />
                Fechar
            </Button>
        </div>
    </ModalView>
</template>

<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos';
import { formatToCapitalize } from '@/utils/formatters';
import { format } from 'date-fns';
import { Box, Eye, FileDigit, FilePlus, FileSymlink, Info, MessageCircleMore, OctagonX } from 'lucide-vue-next';
import { ref } from 'vue'

const store = useOrdemServicoStore()
const emit = defineEmits(['update:visible', 'close', 'save'])

const activeTab = ref('geral')

// Arquivos
const arquivos = ref<Array<any>>([])
const selectedFiles = ref<Array<string>>([])
const fileInput = ref<HTMLInputElement | null>(null)

function handleFiles(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files) return
    for (let i = 0; i < input.files.length; i++) {
        const f = input.files[i]
        arquivos.value.push({
            id: cryptoRandomId(),
            nome: f.name,
            tamanho: f.size,
            tamanhoFormatado: formatBytes(f.size),
            uploadedAt: new Date().toISOString(),
            file: f,
        })
    }
    // limpar input
    input.value = ''
}

function preview(file: any) {
    // opinião importante: abrir em nova aba é simples e compatível com tipos variados
    if (file.file) {
        const url = URL.createObjectURL(file.file)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 10000)
    }
}

function download(file: any) {
    if (file.file) {
        const url = URL.createObjectURL(file.file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.nome
        a.click()
        URL.revokeObjectURL(url)
    }
}

function downloadSelected() {
    arquivos.value.filter(a => selectedFiles.value.includes(a.id)).forEach(download)
}

function removeSelected() {
    arquivos.value = arquivos.value.filter(a => !selectedFiles.value.includes(a.id))
    selectedFiles.value = []
}

// Mensagens
const mensagens = ref<Array<any>>([
    {
        id: cryptoRandomId(),
        autor: 'Usuário',
        texto: 'Mensagem 1',
        criadoEm: new Date().toISOString(),
    },
    {
        id: cryptoRandomId(),
        autor: 'Usuário',
        texto: 'Mensagem 2',
        criadoEm: new Date().toISOString(),
    },
])
const novaMensagem = ref('')

function enviarMensagem() {
    if (!novaMensagem.value.trim()) return
    mensagens.value.push({
        id: cryptoRandomId(),
        autor: 'Usuário',
        texto: novaMensagem.value.trim(),
        criadoEm: new Date().toISOString(),
    })
    novaMensagem.value = ''
}

// Produtos e serviços
const produtos = ref<Array<any>>([])
const servicos = ref<Array<any>>([])

function formatMoney(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function cryptoRandomId() {
    return Math.random().toString(36).slice(2, 9)
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function statusVariant(status: string) {
    switch ((status || '').toLowerCase()) {
        case 'aberto': return 'default'
        case 'em andamento': return 'secondary'
        case 'finalizado': return 'success'
        case 'cancelado': return 'destructive'
        default: return 'default'
    }
}

</script>
