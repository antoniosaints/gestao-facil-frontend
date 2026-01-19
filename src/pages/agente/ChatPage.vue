<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
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
    Wrench
} from 'lucide-vue-next';
import { GeminiRepository } from '@/repositories/gemini-repository';
import { useUiStore } from '@/stores/ui/uiStore';
import { POSITION, useToast } from 'vue-toastification';
import { Separator } from '@/components/ui/separator';

const chatHistory = ref<any[]>([]);
const storeUi = useUiStore();
const toast = useToast();
// --- Interfaces ---
interface Message {
    id: number;
    text: string;
    isUser: boolean;
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

const saveSettings = () => {
    localStorage.setItem('openai_key', apiKey.value.trim());
    isSettingsOpen.value = false;
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
            return `<pre class="code-block my-3 bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code>${code.trim()}</code></pre>`;
        })

        // --- NOVO: 3. Tabelas Markdown ---
        .replace(/^(\|.*\|)\n(\|[:\-\s|]+\|)\n((?:\|.*\|(?:\n|$))*)/gm, (match, headerLine, separatorLine, bodyLines) => {
            const parseRow = (row: string) => {
                // Remove os pipes das extremidades e divide por |
                const cells = row.replace(/^\||\|$/g, '').split('|');
                return cells;
            };

            const headers = parseRow(headerLine);
            const rows = bodyLines.trim().split('\n').filter((r: any) => r.trim() !== '');

            const headerHtml = `<thead><tr class="bg-gray-100 dark:bg-gray-800">` +
                headers.map(h => `<th class="px-4 py-2 border border-gray-300 dark:border-gray-600 font-bold text-left">${h.trim()}</th>`).join('') +
                `</tr></thead>`;

            const bodyHtml = `<tbody>` +
                rows.map((row: any) => {
                    const cells = parseRow(row);
                    return `<tr class="border-b border-gray-200 dark:border-gray-700">` +
                        cells.map(c => `<td class="px-4 py-2 border border-gray-300 dark:border-gray-600">${c.trim()}</td>`).join('') +
                        `</tr>`;
                }).join('') +
                `</tbody>`;

            return `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm text-left">${headerHtml}${bodyHtml}</table></div>`;
        })

        // 4. Código Inline (`código`)
        .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')

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
const addMessage = (text: string, isUser: boolean) => {
    messages.value.push({
        id: Date.now(),
        text,
        isUser
    });
};

const callIA = async (message: string) => {
    // Se você não precisar mais da chave API no front (pois o backend resolve), 
    // pode remover a validação de apiKey.value ou mantê-la se o backend exigir via Header.

    isTyping.value = true;

    try {
        // Chamada ao repository que você criou
        // Enviamos o prompt atual e o histórico acumulado
        const response = await GeminiRepository.chat(message, chatHistory.value);

        /* 
           Baseado no seu retorno:
           { "status": 200, "data": { "reply": "...", "history": [...] } }
        */
        if (response.status === 200) {
            const { reply, history: newHistory } = response.data;

            // 1. Atualiza o histórico local com o que voltou do servidor
            chatHistory.value = newHistory;

            // 2. Exibe a mensagem na tela
            addMessage(reply, false);
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
    if (text && !isTyping.value) {
        addMessage(text, true);
        userInput.value = '';
        callIA(text);
    }
};

const quickAction = (action: string) => {
    if (isTyping.value) return;
    addMessage(action, true);
    callIA(action);
};

const clearChat = () => {
    messages.value = [];
    chatHistory.value = [];
    userInput.value = '';
    addMessage(`Olá, ${storeUi.usuarioLogged.nome.split(' ')[0]}, bem vindo ao Core! Como posso ajudar?`, false);
    toast.success("Chat limpo com sucesso!", {
        timeout: 2000,
        position: POSITION.BOTTOM_CENTER
    });
};
</script>

<template>
    <div class="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-5.3rem)] -m-4 rounded-md bg-card font-sans">
        <!-- Header -->
        <header class="border-b rounded-t-md p-4 flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-2">
                <div class="bg-blue-600 p-2 rounded-lg text-white">
                    <Bot :size="24" />
                </div>
                <div>
                    <h1 class="font-bold text-foreground">Core IA</h1>
                    <span class="text-xs flex items-center gap-1" :class="'text-green-500'">
                        <span class="w-2 h-2 rounded-full" :class="['bg-green-500 animate-pulse']"></span>
                        {{ 'Pronto para usar' }}
                    </span>
                </div>
            </div>
            <!-- <button @click="toggleSettings" class="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
                <Settings :size="20" />
            </button> -->
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

                <label class="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                <input v-model="apiKey" type="password" placeholder="sk-..."
                    class="w-full p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none">
                <p class="text-xs text-gray-500 mb-6 italic">*Sua chave fica salva apenas no seu navegador.</p>

                <div class="flex justify-end gap-2">
                    <button @click="toggleSettings" class="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                        Cancelar
                    </button>
                    <button @click="saveSettings"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                        Salvar
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
                    <button @click="quickAction('Me mostre os produtos do sistema')" class="action-btn">
                        <Package class="text-green-500" :size="16" /> Produtos
                    </button>
                    <button @click="quickAction('Quais clientes tenho no sistema?')" class="action-btn">
                        <Users class="text-blue-500" :size="16" /> Clientes
                    </button>
                    <button @click="quickAction('Quero um resumo das vendas do sistema.')" class="action-btn">
                        <Tag class="text-purple-500" :size="16" /> Vendas
                    </button>
                    <button @click="quickAction('Quais serviços tenho no sistema?')" class="action-btn">
                        <Wrench class="text-yellow-500" :size="16" /> Serviços
                    </button>
                </div>

                <!-- Input Area -->
                <div class="relative hidden md:flex items-center">
                    <input v-model="userInput" @keyup.enter="handleSendMessage" type="text"
                        placeholder="Digite sua mensagem..."
                        class="w-full p-4 pr-12 rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition">
                    <button @click="handleSendMessage" :disabled="!userInput.trim() || isTyping"
                        class="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <SendHorizontal :size="20" />
                    </button>
                </div>
            </div>
        </footer>
        <nav
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark md:hidden flex justify-around h-20 shadow-lg z-20">
            <div class="relative flex w-full px-3 items-center">
                <input v-model="userInput" @keyup.enter="handleSendMessage" type="text"
                    placeholder="Digite sua mensagem..."
                    class="w-full p-4 pr-14 rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition">
                <button @click="handleSendMessage" :disabled="!userInput.trim() || isTyping"
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