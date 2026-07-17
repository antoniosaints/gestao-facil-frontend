<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import {
    Bot,
    Settings,
    Sparkles,
    SendHorizontal,
    User,
    X,
    Package,
    Users,
    Tag,
    Trash,
    Wrench,
    FileQuestion,
    ImagePlus
} from 'lucide-vue-next';
import { GeminiRepository, type GeminiChatImage } from '@/repositories/gemini-repository';
import IaUsageIndicator from '@/components/ia/IaUsageIndicator.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import { useCoreIaWidget } from '@/composables/useCoreIaWidget';
import { POSITION, useToast } from 'vue-toastification';
import { Separator } from '@/components/ui/separator';

// Modo embutido: usado pelo widget flutuante (ocupa o painel, sem a altura/margens de página).
const props = defineProps<{ embedded?: boolean }>();

// --- Variáveis ---
const chatHistory = ref<any[]>([]);
const storeUi = useUiStore();
const { habilitado: widgetFlutuanteHabilitado } = useCoreIaWidget();
const toast = useToast();
// --- Interfaces ---
interface Message {
    id: number;
    text: string;
    isUser: boolean;
    imagePreview?: string;
    imageName?: string;
}

// --- Estado ---
const messages = ref<Message[]>([
    {
        id: Date.now(),
        text: `Olá, ${storeUi.usuarioLogged.nome.split(' ')[0]}, bem vindo ao Core! Como posso ajudar?`,
        isUser: false
    }
]);

const userInput = ref('');
const apiKey = ref('');
const isSettingsOpen = ref(false);
const isTyping = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const selectedImage = ref<{ dataUrl: string; data: string; mimeType: string; name: string } | null>(null);
const canSend = computed(() => Boolean(userInput.value.trim() || selectedImage.value) && !isTyping.value);

// --- Lógica ---
onMounted(() => {
    const savedKey = localStorage.getItem('openai_key');
    if (savedKey) {
        apiKey.value = savedKey;
    }
});

const scrollToBottom = async () => {
    await nextTick();
    if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
};

// Observa mudanças nas mensagens para rolar o scroll
watch(messages, () => {
    scrollToBottom();
}, { deep: true });

const toggleSettings = () => {
    isSettingsOpen.value = !isSettingsOpen.value;
};

const formatMessage = (text: string) => {
    if (!text) return '';

    let html = text
        // 1. Escapar HTML perigoso (Segurança)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

        // 2. Blocos de Código (```json ... ```)
        .replace(/```(?:json|javascript|js|bash|typescript)?\n([\s\S]*?)```/g, (_match, code) => {
            return `<pre class="code-block my-3 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code>${code.trim()}</code></pre>`;
        })

        // 4. Código Inline (`código`)
        .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-900 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')

        // 5. Títulos (Headers)
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')

        // 6. Negrito (**texto**)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

        // 7. Itálico (*texto*)
        .replace(/\*(.*?)\*/g, '<em>$1</em>')

        // 8. Listas (Linhas começando com - ou *)
        .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')

        // 9. Links ([texto](url))
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')

        // 10. Citações (> texto)
        .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-2">$1</blockquote>')

        // 11. Quebras de linha
        // Ocultamos a quebra se a linha terminar com uma tag de bloco para evitar espaços excessivos
        .replace(/\n/g, (match) => {
            return '<br>';
        });

    return html;
};
const usageIndicator = ref<{ refresh: () => void } | null>(null);

const addMessage = (text: string, isUser: boolean, image?: { preview: string; name: string }) => {
    messages.value.push({
        id: Date.now(),
        text,
        isUser,
        imagePreview: image?.preview,
        imageName: image?.name,
    });
};

const callIA = async (message: string, image?: GeminiChatImage | null) => {
    // Se você não precisar mais da chave API no front (pois o backend resolve), 
    // pode remover a validação de apiKey.value ou mantê-la se o backend exigir via Header.

    isTyping.value = true;

    try {
        // Chamada ao repository que você criou
        // Enviamos o prompt atual e o histórico acumulado
        const response = await GeminiRepository.chat(message, chatHistory.value, image);

        /* 
           Baseado no seu retorno:
           { "status": 200, "data": { "reply": "...", "history": [...] } }
        */
        if (response.status === 200) {
            const { reply, history: newHistory } = response.data;

            // 1. Atualiza o histórico local com o que voltou do servidor
            chatHistory.value = newHistory;

            // 2. Exibe a mensagem na tela (nunca um balão vazio — usa um fallback de confirmação
            //    caso o modelo não devolva texto após executar uma ação).
            const replyText = typeof reply === 'string' && reply.trim() ? reply : 'Pronto! ✅';
            addMessage(replyText, false);

            // 3. Atualiza o indicador de uso de IA (consumiu tokens)
            usageIndicator.value?.refresh();
        } else {
            throw new Error(response.message || "Erro desconhecido");
        }

    } catch (error: any) {
        console.error("Erro na API:", error);
        addMessage("Desculpe, ocorreu um erro ao processar sua solicitação.", false);
    } finally {
        isTyping.value = false;
    }
};

const handleSendMessage = () => {
    const text = userInput.value.trim();
    const image = selectedImage.value;

    if ((text || image) && !isTyping.value) {
        addMessage(text || 'Analisar imagem', true, image ? { preview: image.dataUrl, name: image.name } : undefined);
        userInput.value = '';
        selectedImage.value = null;
        callIA(text || 'Analise a imagem enviada e responda em português.', image ? {
            data: image.data,
            mimeType: image.mimeType,
            name: image.name,
        } : null);
    }
};

const quickAction = (action: string) => {
    if (isTyping.value) return;
    addMessage(action, true);
    callIA(action);
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
});

const loadImageFromDataUrl = (dataUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível preparar a imagem.'));
    image.src = dataUrl;
});

const resizeImageForCoreIa = async (file: File) => {
    const originalDataUrl = await readFileAsDataUrl(file);
    const image = await loadImageFromDataUrl(originalDataUrl);
    const attempts = [
        { maxDimension: 1600, quality: 0.84 },
        { maxDimension: 1280, quality: 0.78 },
        { maxDimension: 1024, quality: 0.72 },
        { maxDimension: 768, quality: 0.68 },
    ];
    const maxBase64Bytes = 4 * 1024 * 1024;
    let bestDataUrl = originalDataUrl;

    for (const attempt of attempts) {
        const naturalWidth = image.naturalWidth || image.width;
        const naturalHeight = image.naturalHeight || image.height;
        const largestSide = Math.max(naturalWidth, naturalHeight);
        const scale = largestSide > attempt.maxDimension ? attempt.maxDimension / largestSide : 1;
        const width = Math.max(1, Math.round(naturalWidth * scale));
        const height = Math.max(1, Math.round(naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) break;

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', attempt.quality);
        bestDataUrl = dataUrl;
        const base64 = dataUrl.split(',')[1] || '';
        if (base64.length <= maxBase64Bytes) {
            return { dataUrl, data: base64, mimeType: 'image/jpeg', name: file.name };
        }
    }

    const data = bestDataUrl.split(',')[1] || '';
    return { dataUrl: bestDataUrl, data, mimeType: 'image/jpeg', name: file.name };
};

const handleImageChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast.error('Selecione um arquivo de imagem.');
        return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
        toast.error('A imagem deve ter no máximo 10 MB.');
        return;
    }

    try {
        selectedImage.value = await resizeImageForCoreIa(file);
    } catch (error: any) {
        toast.error(error?.message || 'Não foi possível processar a imagem.');
    }
};

const removeSelectedImage = () => {
    selectedImage.value = null;
};

const clearChat = () => {
    messages.value = [];
    chatHistory.value = [];
    userInput.value = '';
    selectedImage.value = null;
    addMessage(`Olá, ${storeUi.usuarioLogged.nome.split(' ')[0]}, bem vindo ao Core! Como posso ajudar?`, false);
    toast.success("Chat limpo com sucesso!", {
        timeout: 2000,
        position: POSITION.BOTTOM_CENTER
    });
};
</script>

<template>
    <div :class="['flex flex-col rounded-md bg-card font-sans', props.embedded ? 'h-full' : 'h-[calc(100vh-6rem)] md:h-[calc(100vh-5.3rem)] -m-4']">
        <!-- Header -->
        <header class="border-b rounded-t-md p-3 flex items-center justify-between gap-2 shadow-sm">
            <div class="flex items-center gap-2 min-w-0">
                <div class="bg-blue-600 p-2 rounded-lg text-white shrink-0">
                    <Bot :size="22" />
                </div>
                <div class="min-w-0">
                    <h1 class="font-bold leading-tight text-foreground truncate">Core IA</h1>
                    <span class="text-[11px] flex items-center gap-1 text-green-500 whitespace-nowrap">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                        Pronto para usar
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <IaUsageIndicator ref="usageIndicator" />
                <button type="button" title="Configurações" @click="toggleSettings"
                    class="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    <Settings :size="20" />
                </button>
            </div>
        </header>

        <!-- Modal de Configuração -->
        <div v-if="isSettingsOpen" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-muted rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Configurações</h2>
                    <button @click="toggleSettings" class="text-gray-400 hover:text-gray-600">
                        <X :size="20" />
                    </button>
                </div>

                <!-- Preferência: botão flutuante do Core IA em todo o sistema -->
                <label class="mb-6 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <span class="text-sm">
                        <span class="block font-medium text-foreground">Botão flutuante</span>
                        <span class="text-xs text-muted-foreground">Mostrar o atalho do Core IA em todas as telas.</span>
                    </span>
                    <input v-model="widgetFlutuanteHabilitado" type="checkbox"
                        class="h-5 w-5 shrink-0 accent-blue-600 cursor-pointer">
                </label>

                <div class="flex justify-end">
                    <button @click="toggleSettings"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                        Fechar
                    </button>
                </div>
            </div>
        </div>

        <!-- Chat Container -->
        <main ref="chatContainer"
            class="flex-1 overflow-y-auto p-4 space-y-2 md:max-w-4xl md:mx-auto w-full no-scrollbar">
            <div v-for="msg in messages" :key="msg.id"
                :class="['flex gap-3', msg.isUser ? 'flex-row-reverse' : 'max-w-[80%]']">
                <div :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    msg.isUser ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-600'
                ]">
                    <User v-if="msg.isUser" :size="18" />
                    <Sparkles v-else :size="18" />
                </div>
                <div :class="[
                    'px-4 py-2 rounded-2xl shadow-sm border', /* Removido o whitespace-pre-wrap aqui */
                    msg.isUser
                        ? 'bg-blue-600 dark:bg-blue-900 text-white rounded-tr-none border-blue-500 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-800 text-foreground rounded-tl-none border-gray-100 dark:border-gray-700'
                ]">
                    <!-- Substituído o <p>{{ msg.text }}</p> por esta div com v-html -->
                    <div v-if="msg.imagePreview" class="mb-2 overflow-hidden rounded-xl border border-white/20 bg-black/5">
                        <img :src="msg.imagePreview" :alt="msg.imageName || 'Imagem enviada'" class="max-h-56 w-full object-contain" />
                    </div>
                    <div class="text-sm md:text-base leading-relaxed message-content" v-html="formatMessage(msg.text)">
                    </div>
                </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="isTyping" class="flex gap-3 max-w-[80%]">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles class="text-blue-600" :size="18" />
                </div>
                <div
                    class="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center border border-gray-100 dark:border-gray-700">
                    <span class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                    <span class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                    <span class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white dark:bg-gray-800 border-t rounded-b-lg p-4">
            <div class="md:max-w-4xl md:mx-auto w-full space-y-2">
                <!-- Quick Actions -->
                <div class="flex gap-2 items-center overflow-x-auto no-scrollbar">
                    <button type="button" v-if="messages.length > 1" @click="clearChat" class="action-btn">
                        <Trash class="text-red-500" :size="16" />
                    </button>
                    <Separator v-if="messages.length > 1" orientation="vertical" class="h-8" />
                    <button @click="quickAction('O que pode fazer?')" class="action-btn">
                        <FileQuestion class="text-cyan-500" :size="16" /> O que pode fazer?
                    </button>
                    <button @click="quickAction('Me mostre os produtos do sistema')" class="action-btn">
                        <Package class="text-green-500" :size="16" /> Produtos
                    </button>
                    <button @click="quickAction('Quais clientes tenho no sistema?')" class="action-btn">
                        <Users class="text-blue-500" :size="16" /> Clientes
                    </button>
                    <button @click="quickAction('Quero um resumo das vendas do sistema.')" class="action-btn">
                        <Tag class="text-purple-500" :size="16" /> Vendas
                    </button>
                    <button @click="quickAction('Quais Ordens de serviço tenho no sistema?')" class="action-btn">
                        <Wrench class="text-yellow-500" :size="16" /> Serviços
                    </button>
                </div>

                <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageChange">

                <div v-if="selectedImage" class="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-2 text-sm dark:border-blue-900 dark:bg-blue-950/40">
                    <img :src="selectedImage.dataUrl" :alt="selectedImage.name" class="h-12 w-12 rounded-lg object-cover">
                    <div class="min-w-0 flex-1">
                        <p class="truncate font-medium text-foreground">{{ selectedImage.name }}</p>
                        <p class="text-xs text-muted-foreground">A imagem será processada e descartada após a resposta.</p>
                    </div>
                    <button type="button" class="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-950" @click="removeSelectedImage">
                        Remover
                    </button>
                </div>

                <!-- Input Area -->
                <div class="relative hidden md:flex items-center">
                    <button type="button" title="Anexar imagem" :disabled="isTyping" @click="imageInput?.click()"
                        class="absolute left-2 p-2 text-muted-foreground rounded-xl hover:bg-muted hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <ImagePlus :size="20" />
                    </button>
                    <input v-model="userInput" @keyup.enter="handleSendMessage" type="text"
                        placeholder="Digite sua mensagem..."
                        class="w-full p-4 pl-12 pr-12 rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition">
                    <button @click="handleSendMessage" :disabled="!canSend"
                        class="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <SendHorizontal :size="20" />
                    </button>
                </div>
            </div>
        </footer>
        <nav
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark md:hidden flex justify-around h-20 shadow-lg z-20">
            <div class="relative flex w-full px-3 items-center">
                <button type="button" title="Anexar imagem" :disabled="isTyping" @click="imageInput?.click()"
                    class="absolute left-5 p-2 text-muted-foreground rounded-xl hover:bg-muted hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <ImagePlus :size="20" />
                </button>
                <input v-model="userInput" @keyup.enter="handleSendMessage" type="text"
                    placeholder="Digite sua mensagem..."
                    class="w-full p-4 pl-12 pr-14 rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition">
                <button @click="handleSendMessage" :disabled="!canSend"
                    class="absolute right-6 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <SendHorizontal :size="20" />
                </button>
            </div>
        </nav>
    </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
    display: none;
}

.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
    scroll-behavior: smooth;
}

.typing-dot {
    animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}

/* Estilização para o conteúdo renderizado via v-html */
:deep(strong) {
    font-weight: 700;
}

:deep(.code-block) {
    white-space: pre;
    /* Mantém a indentação do código */
    font-family: monospace;
}

:deep(br) {
    content: "";
    display: block;
    margin: 4px 0;
}

@keyframes typing {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-5px);
    }
}

.message-content :deep(br) {
    content: "";
    display: block;
    margin-top: 0.5rem;
}

.message-content :deep(li)+br {
    display: none;
    /* Evita espaço excessivo em listas */
}

.action-btn {
    @apply flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap shadow-sm;
}
</style>
