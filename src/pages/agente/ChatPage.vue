<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import {
    Bot,
    Settings,
    Sparkles,
    ShoppingCart,
    PackagePlus,
    RefreshCw,
    BarChart3,
    SendHorizontal,
    User,
    X
} from 'lucide-vue-next';

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
        text: "Olá! Configure sua chave API nas configurações para começarmos a gerir suas vendas, compras e estoque.",
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

    return text
        // Negrito: **texto** -> <strong>texto</strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Blocos de código JSON
        .replace(/```json\n([\s\S]*?)```/g, '<div class="code-block mt-2 bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">$1</div>')
        // Outros blocos de código
        .replace(/```([\s\S]*?)```/g, '<div class="code-block mt-2 bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">$1</div>')
        // Quebras de linha -> <br>
        .replace(/\n/g, '<br>');
};

const addMessage = (text: string, isUser: boolean) => {
    messages.value.push({
        id: Date.now(),
        text,
        isUser
    });
};

const tools = [
    {
        type: "function",
        function: {
            name: "register_sale",
            description: "Registra uma nova venda no sistema de ERP",
            parameters: {
                type: "object",
                properties: {
                    product: { type: "string", description: "Nome do produto vendido" },
                    quantity: { type: "number", description: "Quantidade vendida" },
                    price: { type: "number", description: "Preço unitário (opcional)" }
                },
                required: ["product", "quantity"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_inventory",
            description: "Consulta o estoque atual",
            parameters: {
                type: "object",
                properties: {
                    category: { type: "string", enum: ['alimentos', 'eletronicos', 'limpeza'] }
                }
            }
        }
    }
];

// const SaleSchema = z.object({
//     product: z.string().min(1, "Nome do produto é obrigatório"),
//     quantity: z.number().int().positive("A quantidade deve ser maior que zero"),
//     price: z.number().positive("O preço deve ser positivo").optional()
// });

// const InventorySchema = z.object({
//     category: z.enum(['alimentos', 'eletronicos', 'limpeza']).optional(),
// });

// type SaleType = z.infer<typeof SaleSchema>;

const handleFunctionCall = (name: string, args: string) => {
    const parsedArgs = JSON.parse(args);

    if (name === 'register_sale') {
        // Validação com Zod
        // const result = SaleSchema.safeParse(parsedArgs);
        // if (!result.success) {
        //     return `Erro de validação: ${result.error.errors.map(e => e.message).join(', ')}`;
        // }

        // // Aqui você chamaria sua API real de backend
        // console.log("Venda registrada no banco:", result.data);
        // return `Sucesso: Venda de ${result.data.quantity}x ${result.data.product} registrada com sucesso!`;
    }

    if (name === 'get_inventory') {
        return `O estoque de ${parsedArgs.category || 'geral'} está em dia. Itens principais: Maçã (50), Banana (20).`;
    }

    return "Função não encontrada.";
};

const callIA = async (message: string) => {
    if (!apiKey.value) {
        alert("Por favor, configure sua chave API da OpenAI primeiro.");
        isSettingsOpen.value = true;
        return;
    }

    isTyping.value = true;

    let chatMessages = [
        { role: "system", content: "Você é um assistente de  gestão ERP. Use as funções disponíveis para registrar dados e também ajude o usuário com conversas gerais, sempre seja direto e profissional e use Markdown para formatar listas ou negrito." },
        { role: "user", content: message }
    ];


    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.value}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: chatMessages,
                temperature: 0.7
            })
        });

        const data = await response.json();
        const responseMessage = data.choices[0].message;
        if (data.error) throw new Error(data.error.message);

        // Verificar se a IA quer chamar uma função
        if (responseMessage.tool_calls) {
            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                const functionArgs = toolCall.function.arguments;

                // Executa a lógica local
                const result = handleFunctionCall(functionName, functionArgs);

                // Adiciona o resultado ao chat (opcional: você pode fazer uma segunda chamada à IA para ela comentar o resultado)
                addMessage(`[Ação: ${functionName}] ${result}`, false);
            }
        } else {
            addMessage(responseMessage.content, false);
        }
    } catch (error: any) {
        addMessage("Erro: " + error.message, false);
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
</script>

<template>
    <div class="flex flex-col h-[calc(100vh-7.6rem)] rounded-md bg-gray-100 font-sans">
        <!-- Header -->
        <header class="border-b rounded-t-md p-4 flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-2">
                <div class="bg-indigo-600 p-2 rounded-lg text-white">
                    <Bot :size="24" />
                </div>
                <div>
                    <h1 class="font-bold text-gray-800">Assistente de Gestão</h1>
                    <span class="text-xs flex items-center gap-1" :class="apiKey ? 'text-green-500' : 'text-red-500'">
                        <span class="w-2 h-2 rounded-full"
                            :class="[apiKey ? 'bg-green-500 animate-pulse' : 'bg-red-500']"></span>
                        {{ apiKey ? 'Pronto para usar' : 'Sem Chave API' }}
                    </span>
                </div>
            </div>
            <button @click="toggleSettings" class="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
                <Settings :size="20" />
            </button>
        </header>

        <!-- Modal de Configuração -->
        <div v-if="isSettingsOpen" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Configurações</h2>
                    <button @click="toggleSettings" class="text-gray-400 hover:text-gray-600">
                        <X :size="20" />
                    </button>
                </div>

                <label class="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                <input v-model="apiKey" type="password" placeholder="sk-..."
                    class="w-full p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none">
                <p class="text-xs text-gray-500 mb-6 italic">*Sua chave fica salva apenas no seu navegador.</p>

                <div class="flex justify-end gap-2">
                    <button @click="toggleSettings" class="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                        Cancelar
                    </button>
                    <button @click="saveSettings"
                        class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
                        Salvar
                    </button>
                </div>
            </div>
        </div>

        <!-- Chat Container -->
        <main ref="chatContainer"
            class="flex-1 overflow-y-auto p-4 space-y-4 md:max-w-4xl md:mx-auto w-full no-scrollbar">
            <div v-for="msg in messages" :key="msg.id"
                :class="['flex gap-3', msg.isUser ? 'flex-row-reverse' : 'max-w-[80%]']">
                <div :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    msg.isUser ? 'bg-gray-800 text-white' : 'bg-indigo-100 text-indigo-600'
                ]">
                    <User v-if="msg.isUser" :size="18" />
                    <Sparkles v-else :size="18" />
                </div>
                <div :class="[
                    'p-4 rounded-2xl shadow-sm border', /* Removido o whitespace-pre-wrap aqui */
                    msg.isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500'
                        : 'bg-white text-gray-700 rounded-tl-none border-gray-100'
                ]">
                    <!-- Substituído o <p>{{ msg.text }}</p> por esta div com v-html -->
                    <div class="text-sm md:text-base leading-relaxed" v-html="formatMessage(msg.text)"></div>
                </div>
            </div>

            <!-- Typing Indicator -->
            <div v-if="isTyping" class="flex gap-3 max-w-[80%]">
                <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles class="text-indigo-600" :size="18" />
                </div>
                <div
                    class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center border border-gray-100">
                    <span class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                    <span class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                    <span class="w-2 h-2 bg-gray-400 rounded-full typing-dot"></span>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t rounded-b-lg p-4">
            <div class="md:max-w-4xl md:mx-auto w-full space-y-4">
                <!-- Quick Actions -->
                <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button @click="quickAction('Quero registrar uma venda')" class="action-btn">
                        <ShoppingCart class="text-green-500" :size="16" /> Vendas
                    </button>
                    <button @click="quickAction('Quero registrar uma compra')" class="action-btn">
                        <PackagePlus class="text-blue-500" :size="16" /> Compras
                    </button>
                    <button @click="quickAction('Quais produtos precisam de reposição?')" class="action-btn">
                        <RefreshCw class="text-orange-500" :size="16" /> Reposição
                    </button>
                    <button @click="quickAction('Me mostre o relatório de vendas de hoje')" class="action-btn">
                        <BarChart3 class="text-purple-500" :size="16" /> Relatórios
                    </button>
                </div>

                <!-- Input Area -->
                <div class="relative flex items-center">
                    <input v-model="userInput" @keyup.enter="handleSendMessage" type="text"
                        placeholder="Digite sua mensagem..."
                        class="w-full p-4 pr-12 rounded-2xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition">
                    <button @click="handleSendMessage" :disabled="!userInput.trim() || isTyping"
                        class="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <SendHorizontal :size="20" />
                    </button>
                </div>
            </div>
        </footer>
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

.action-btn {
    @apply flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap shadow-sm;
}
</style>