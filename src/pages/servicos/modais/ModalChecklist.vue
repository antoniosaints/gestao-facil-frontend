<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import ModalView from '@/components/formulario/ModalView.vue';
import BadgeCell from '@/components/tabela/BadgeCell.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos';
import { formatToCapitalize } from '@/utils/formatters';
import { BadgeCheck, CircleAlert, CircleArrowLeft, CircleArrowRight, DiamondMinus, FileCheck2, FilePlus, ListChecks, OctagonX, Trash } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
const store = useOrdemServicoStore()
const toast = useToast()
interface ChecklistItem {
    id: number,
    texto: string,
    status: string | null,
    observacao: string,
    personalizado: boolean
}

const inputAdicionarItem = ref<string>('');
const tipoEquipamento = ref<string>('');
const progressoTexto = ref<string>('0 de 0 itens verificados');
const progresso = ref<number>(0);
const tab = ref<'identify' | 'checklist' | 'report'>('identify');

const checklistItens = ref<ChecklistItem[]>([]);

const checklistTemplates: Record<string, string[]> = {
    notebook: [
        "Aparência externa (arranhões, rachaduras)",
        "Tela/Display funcionando corretamente",
        "Teclado - todas as teclas funcionais",
        "Touchpad responsivo",
        "Portas USB funcionando",
        "Porta HDMI/VGA funcionando",
        "Audio (alto-falantes e microfone)",
        "Webcam funcionando",
        "Wi-Fi conectando normalmente",
        "Bluetooth funcionando",
        "Bateria carregando",
        "Duração da bateria",
        "Ventoinha/Cooler funcionando",
        "Temperatura normal de operação",
        "Sistema operacional inicializando",
        "Antivírus atualizado",
        "Updates do sistema em dia"
    ],
    desktop: [
        "Gabinete - estado físico",
        "Monitor ligando corretamente",
        "Teclado funcionando",
        "Mouse funcionando",
        "Portas USB frontais",
        "Portas USB traseiras",
        "Audio funcionando",
        "Conectividade de rede",
        "Placa de vídeo funcionando",
        "Memória RAM detectada",
        "HD/SSD funcionando",
        "Cooler/Ventoinhas funcionando",
        "Fonte de alimentação estável",
        "Sistema operacional carregando",
        "Antivírus ativo",
        "Drivers atualizados"
    ],
    monitor: [
        "Aparência física (riscos, manchas)",
        "Cabo de força funcionando",
        "Cabo de vídeo conectando",
        "Qualidade da imagem",
        "Brilho e contraste",
        "Pixels mortos ou defeituosos",
        "Botões de controle funcionais",
        "Menu OSD acessível",
        "Múltiplas entradas (se aplicável)",
        "Base/suporte estável",
        "Ajuste de altura funcionando",
        "LED de status funcionando"
    ],
    impressora: [
        "Aparência externa",
        "Cabo de alimentação",
        "Conectividade (USB/Rede/Wi-Fi)",
        "Painel de controle funcionando",
        "Bandeja de papel",
        "Cartucho/Toner instalado",
        "Níveis de tinta/toner",
        "Impressão de teste - qualidade",
        "Impressão frente e verso (se aplicável)",
        "Scanner funcionando (se aplicável)",
        "Cópia funcionando (se aplicável)",
        "Fax funcionando (se aplicável)",
        "Drivers instalados",
        "Configuração de rede"
    ],
    smartphone: [
        "Aparência física (tela, carcaça)",
        "Botão power funcionando",
        "Botões de volume funcionando",
        "Tela touch responsiva",
        "Câmera traseira",
        "Câmera frontal",
        "Flash da câmera",
        "Audio (alto-falante, microfone)",
        "Entrada para fones",
        "Porta de carregamento",
        "Carregamento da bateria",
        "Duração da bateria",
        "Wi-Fi conectando",
        "Dados móveis funcionando",
        "Bluetooth pareando",
        "GPS/localização",
        "Sensores (giroscópio, acelerômetro)"
    ],
    servidor: [
        "Aparência física do equipamento",
        "LEDs de status funcionando",
        "Fonte de alimentação redundante",
        "Ventoinhas funcionando",
        "Temperatura dentro dos parâmetros",
        "Conectividade de rede",
        "Portas de gerenciamento",
        "HD/SSD - status RAID",
        "Memória RAM detectada",
        "Processador funcionando",
        "Sistema operacional carregando",
        "Serviços críticos rodando",
        "Logs de sistema sem erros",
        "Backup funcionando",
        "Monitoramento ativo",
        "Updates de segurança aplicados"
    ]
};

function setStatus(id: number, status: string) {
    const item = checklistItens.value.find(i => i.id === id);
    if (item) {
        item.status = status;
        updateProgresso();
    }
}

// Remover item personalizado
function removerItem(id: number) {
    checklistItens.value = checklistItens.value.filter(i => i.id !== id);
    updateProgresso();
}

function adicionarItem() {
    if (inputAdicionarItem.value.trim()) {
        const novoId = Math.max(...checklistItens.value.map(i => i.id), 0) + 1;
        checklistItens.value.push({
            id: novoId,
            texto: inputAdicionarItem.value.trim(),
            status: null,
            observacao: '',
            personalizado: true
        });
        inputAdicionarItem.value = '';
        updateProgresso();
        return;
    }
    toast.warning('Insira uma descrição para o item', {
        timeout: 3000
    });
}

function adicionarItemPersonalizado() {
    if (tipoEquipamento.value && checklistTemplates[tipoEquipamento.value]) {
        checklistItens.value = checklistTemplates[tipoEquipamento.value].map((item: string, index: number) => ({
            id: index,
            texto: item,
            status: null,
            observacao: '',
            personalizado: false
        }));
    } else {
        checklistItens.value = [];
    }
}

function updateProgresso() {
    const total = checklistItens.value.length;
    const verificados = checklistItens.value.filter(i => i.status !== null).length;
    const percentual = total > 0 ? Math.round((verificados / total) * 100) : 0;

    progressoTexto.value = `${verificados} de ${total} itens verificados`;
    progresso.value = percentual;
}

const totalOk = computed(() => checklistItens.value.filter(i => i.status === 'ok').length);
const totalAtencao = computed(() => checklistItens.value.filter(i => i.status === 'atencao').length);
const totalProblemas = computed(() => checklistItens.value.filter(i => i.status === 'problema').length);
const totalVerificados = computed(() => checklistItens.value.filter(i => i.status !== null).length);
const percentualOk = computed(() => totalVerificados.value > 0 ? Math.round((totalOk.value / totalVerificados.value) * 100) : 0);
const itensProblematicos = computed(() => checklistItens.value.filter(i => i.status === 'problema' || i.status === 'atencao'));

watch(tipoEquipamento, () => {
    adicionarItemPersonalizado();
    updateProgresso();
})
</script>

<template>
    <ModalView v-model:open="store.openModalChecklist" size="5xl" title="Formulario de checklist"
        description="Preencha os campos abaixo">
        <div class="px-4">
            <Tabs v-model="tab" default-value="identify">
                <TabsList class="grid w-max grid-cols-3 rounded-lg">
                    <TabsTrigger value="identify">
                        <FilePlus class="inline-flex mr-1 w-4 h-4" />
                        Identificação
                    </TabsTrigger>
                    <TabsTrigger value="checklist">
                        <ListChecks class="inline-flex mr-1 w-4 h-4" />
                        Checklist
                    </TabsTrigger>
                    <TabsTrigger value="report">
                        <FileCheck2 class="inline-flex mr-1 w-4 h-4" />
                        Relatório
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="identify">
                    <div class="space-y-6 py-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Tipo de Equipamento <span class="text-red-500">*</span>
                                </label>
                                <Select v-model="tipoEquipamento">
                                    <SelectTrigger class="w-full">
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="notebook">Notebook</SelectItem>
                                        <SelectItem value="desktop">Desktop</SelectItem>
                                        <SelectItem value="monitor">Monitor</SelectItem>
                                        <SelectItem value="impressora">Impressora</SelectItem>
                                        <SelectItem value="smartphone">Smartphone</SelectItem>
                                        <SelectItem value="tablet">Tablet</SelectItem>
                                        <SelectItem value="servidor">Servidor</SelectItem>
                                        <SelectItem value="roteador">Roteador</SelectItem>
                                        <SelectItem value="switch">Switch</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Marca <span class="text-red-500">*</span>
                                </label>
                                <Input type="text" name="marca" placeholder="Ex: Dell, HP, Samsung..." />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Modelo <span class="text-red-500">*</span>
                                </label>
                                <Input type="text" name="modelo" placeholder="Ex: Inspiron 15 3000" />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Número de Série
                                </label>
                                <Input type="text" name="numeroSerie" placeholder="Ex: ABC123456789" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Patrimônio
                                </label>
                                <Input type="text" name="patrimonio" placeholder="Ex: PAT001234" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Data do Checklist <span class="text-red-500">*</span>
                                </label>
                                <Calendarpicker />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Responsável pelo Checklist <span class="text-red-500">*</span>
                                </label>
                                <Input type="text" name="responsavel" placeholder="Nome do técnico" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Localização
                                </label>
                                <Input type="text" name="localizacao" placeholder="Ex: Sala 101, Andar 2" />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">
                                Observações Iniciais
                            </label>
                            <Textarea name="observacoesIniciais" rows="3"
                                placeholder="Descreva o estado inicial do equipamento..."></Textarea>
                        </div>

                    </div>
                    <div class="flex justify-end">
                        <Button @click="tab = 'checklist'" type="button"
                            class="bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
                            <CircleArrowRight />
                            Próximo
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="checklist">
                    <div class="space-y-6 py-4">
                        <div class="bg-card border rounded-lg p-4">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-medium ">Itens de Verificação</h3>
                                <div class="flex items-center space-x-4 text-sm">
                                    <div class="flex items-center space-x-1">
                                        <div class="w-3 h-3 bg-green-500 rounded"></div>
                                        <span class="text-gray-500">OK</span>
                                    </div>
                                    <div class="flex items-center space-x-1">
                                        <div class="w-3 h-3 bg-yellow-500 rounded"></div>
                                        <span class="text-gray-500">Atenção</span>
                                    </div>
                                    <div class="flex items-center space-x-1">
                                        <div class="w-3 h-3 bg-red-500 rounded"></div>
                                        <span class="text-gray-500">Problema</span>
                                    </div>
                                    <div class="flex items-center space-x-1">
                                        <div class="w-3 h-3 bg-gray-500 rounded"></div>
                                        <span class="text-gray-500">N/A</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Progresso -->
                            <div class="mb-6">
                                <div class="flex justify-between text-sm text-gray-500 mb-2">
                                    <span>Progresso do Checklist</span>
                                    <span>{{ progressoTexto }}</span>
                                </div>
                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div id="progressoBarra"
                                        class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        :style="{ width: `${progresso}%` }">
                                    </div>
                                </div>
                            </div>

                            <!-- Lista de Checklist Dinâmica -->
                            <div id="checklistItens" class="space-y-3">
                                <div v-if="checklistItens.length === 0" class="text-center text-gray-400 py-8">
                                    Selecione
                                    um <span @click="tab = 'identify'" class="text-blue-500 cursor-pointer">tipo de
                                        equipamento</span> para
                                    carregar o checklist
                                    ou adicione um item
                                    personalizado
                                </div>
                                <div v-for="row in checklistItens"
                                    class="checklist-item bg-background border rounded-lg px-3 py-2 transition-colors">
                                    <div class="flex items-center justify-between gap-2 mb-2">
                                        <div class="flex items-center space-x-3 flex-1">
                                            <span class="font-medium">{{ row.texto }}</span>
                                            <BadgeCell v-if="row.personalizado" :color="'emerald'"
                                                :label="'Personalizado'" class="text-xs" />
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <button @click="setStatus(row.id, 'ok')"
                                                :class="{ 'bg-success text-white': row.status === 'ok', 'bg-body': row.status !== 'ok' }"
                                                class="w-8 h-8 rounded-md hover:bg-success/80 transition-colors">
                                                <span class="text-sm">
                                                    <BadgeCheck class="inline-flex w-5" />
                                                </span>
                                            </button>
                                            <button @click="setStatus(row.id, 'atencao')"
                                                :class="{ 'bg-warning text-white': row.status === 'atencao', 'bg-body': row.status !== 'atencao' }"
                                                class="w-8 h-8 rounded-md hover:bg-warning/80 transition-colors">
                                                <span class="text-sm">
                                                    <CircleAlert class="inline-flex w-5" />
                                                </span>
                                            </button>
                                            <button @click="setStatus(row.id, 'problema')"
                                                :class="{ 'bg-danger text-white': row.status === 'problema', 'bg-body': row.status !== 'problema' }"
                                                class="w-8 h-8 rounded-md hover:bg-danger/80 transition-colors">
                                                <span class="text-sm">
                                                    <OctagonX class="inline-flex w-5" />
                                                </span>
                                            </button>
                                            <button @click="setStatus(row.id, 'na')"
                                                :class="{ 'bg-secondary': row.status === 'na', 'bg-body': row.status !== 'na' }"
                                                class="w-8 h-8 rounded-md hover:bg-secondary/80 transition-colors">
                                                <span class="text-sm">
                                                    <DiamondMinus class="inline-flex w-5" />
                                                </span>
                                            </button>
                                            <button v-if="row.personalizado" @click="removerItem(row.id)"
                                                class="text-red-400 hover:text-red-300 ml-2">
                                                <Trash class="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div class="mt-3">
                                        <Input type="text" placeholder="Observação (opcional)"
                                            v-model="row.observacao" />
                                    </div>
                                </div>

                                <!-- Adicionar item personalizado -->
                                <div class="mt-6 pt-4 border-t">
                                    <div class="flex space-x-3">
                                        <Input type="text" v-model="inputAdicionarItem" @keydown.enter="adicionarItem"
                                            placeholder="Adicionar item personalizado..."
                                            class="flex-1 border border-slate-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        <Button type="button" @click="adicionarItem"
                                            class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                                            Adicionar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-between">
                        <Button @click="tab = 'identify'" type="button"
                            class="bg-gray-600 hover:bg-gray-700 rounded-lg text-white">
                            <CircleArrowLeft />
                            Voltar
                        </Button>
                        <Button @click="tab = 'report'" type="button"
                            class="bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
                            <CircleArrowRight />
                            Próximo
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="report">
                    <div class="space-y-6 py-4">
                        <div class="bg-card border rounded-lg p-6">
                            <h3 class="text-lg font-medium mb-6">Relatório do Checklist</h3>

                            <!-- Resumo Executivo -->
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div class="bg-background rounded-lg p-4 text-center">
                                    <div class="text-2xl font-bold text-green-500">{{ totalOk }}</div>
                                    <div class="text-sm text-gray-500">Itens OK</div>
                                </div>
                                <div class="bg-background rounded-lg p-4 text-center">
                                    <div class="text-2xl font-bold text-yellow-500">{{ totalAtencao }}</div>
                                    <div class="text-sm text-gray-500">Precisam Atenção</div>
                                </div>
                                <div class="bg-background rounded-lg p-4 text-center">
                                    <div class="text-2xl font-bold text-red-500">{{ totalProblemas }}</div>
                                    <div class="text-sm text-gray-500">Com Problemas</div>
                                </div>
                                <div class="bg-background rounded-lg p-4 text-center">
                                    <div class="text-2xl font-bold text-blue-500">{{ percentualOk }}%</div>
                                    <div class="text-sm text-gray-500">Status Geral</div>
                                </div>
                            </div>

                            <!-- Informações do Equipamento -->
                            <div class="mb-6">
                                <h4 class="font-medium border-b pb-2 mb-4">Informações do
                                    Equipamento</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div class="space-y-2">
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Tipo:</span>
                                            <span class="" id="relTipo">{{ formatToCapitalize(tipoEquipamento) || '-'
                                                }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Marca:</span>
                                            <span class="" id="relMarca">-</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Modelo:</span>
                                            <span class="" id="relModelo">-</span>
                                        </div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Série:</span>
                                            <span class="" id="relSerie">-</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Patrimônio:</span>
                                            <span class="" id="relPatrimonio">-</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-500">Data:</span>
                                            <span class="" id="relData">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Itens com Problemas/Atenção -->
                            <div class="mb-6">
                                <h4 class="font-medium border-b pb-2 mb-4">Itens que Requerem
                                    Atenção</h4>
                                <div id="itensProblemas" class="space-y-2">
                                    <div v-if="itensProblematicos.length === 0" class="text-center text-gray-400 py-4">
                                        Nenhum item com problema identificado
                                    </div>
                                    <div v-else v-for="item in itensProblematicos"
                                        class="flex items-start space-x-3 p-3 bg-body border rounded">
                                        <div class="w-3 h-3 mt-1 rounded"
                                            :class="{ 'bg-red-500': item.status === 'problema', 'bg-yellow-500': item.status === 'atencao' }">
                                        </div>
                                        <div class="flex-1">
                                            <div class="font-medium">{{ item.texto }}</div>
                                            <div v-if="item.observacao" class="text-gray-500 text-sm mt-1">
                                                {{ item.observacao }}
                                            </div>
                                        </div>
                                        <span class="text-xs px-2 py-1 rounded"
                                            :class="{ 'bg-red-500 text-white': item.status === 'problema', 'bg-yellow-500 text-black': item.status === 'atencao' }">
                                            {{ item.status === 'problema' ? 'PROBLEMA' : 'ATENÇÃO' }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Observações Finais -->
                            <div>
                                <label class="block text-sm font-medium mb-2">
                                    Observações Finais e Recomendações
                                </label>
                                <textarea name="observacoesFinais" rows="4"
                                    placeholder="Descreva as principais conclusões, recomendações de manutenção ou ações necessárias..."
                                    class="w-full bg-card border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                            </div>
                        </div>

                        <!-- Botões de Ação -->
                        <div class="flex justify-end space-x-4 pt-6 border-t ">
                            <button type="button" id="cancelarChecklist"
                                class="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg">
                                Cancelar
                            </button>
                            <button type="button" id="exportarPdf"
                                class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg">
                                Exportar PDF
                            </button>
                            <button type="submit" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                                Salvar Checklist
                            </button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    </ModalView>
</template>