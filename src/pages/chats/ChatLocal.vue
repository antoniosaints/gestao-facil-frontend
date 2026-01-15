<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Send, Paperclip, Smile, MoreVertical, Search, Phone, Video, Image as ImageIcon, File, Mic } from 'lucide-vue-next'

interface Message {
    id: number
    text: string
    sender: 'user' | 'other'
    timestamp: string
    avatar: string
    name: string
    status: 'online' | 'offline'
    unread?: boolean
}

interface Chat {
    id: number
    name: string
    avatar: string
    lastMessage: string
    timestamp: string
    unread: number
    status: 'online' | 'offline'
}

const newMessage = ref('')
const activeChat = ref(1)
const searchTerm = ref('')

const messages = ref<Message[]>([
    { id: 1, text: 'Olá! Como você está?', sender: 'other', timestamp: '10:00', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', name: 'Maria Silva', status: 'online' },
    { id: 2, text: 'Estou bem, obrigado! E você?', sender: 'user', timestamp: '10:01', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=João', name: 'Você', status: 'online' },
    { id: 3, text: 'Também estou bem! Vamos marcar aquela reunião?', sender: 'other', timestamp: '10:02', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', name: 'Maria Silva', status: 'online' },
    { id: 4, text: 'Claro! Que tal amanhã às 14h?', sender: 'user', timestamp: '10:03', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=João', name: 'Você', status: 'online' },
    { id: 5, text: 'Perfeito! Enviarei o convite.', sender: 'other', timestamp: '10:04', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', name: 'Maria Silva', status: 'online' },
])

const chats = ref<Chat[]>([
    { id: 1, name: 'Maria Silva', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', lastMessage: 'Perfeito! Enviarei o convite.', timestamp: '10:04', unread: 0, status: 'online' },
    { id: 2, name: 'Carlos Santos', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos', lastMessage: 'Precisamos revisar o projeto.', timestamp: '09:30', unread: 2, status: 'online' },
    { id: 3, name: 'Ana Oliveira', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana', lastMessage: 'Documentos anexados.', timestamp: 'Ontem', unread: 0, status: 'offline' },
    { id: 4, name: 'Pedro Costa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro', lastMessage: 'Obrigado pela ajuda!', timestamp: 'Qua', unread: 1, status: 'online' },
    { id: 5, name: 'Equipe Dev', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team', lastMessage: 'Reunião amanhã às 10h', timestamp: 'Ter', unread: 0, status: 'online' },
])

const filteredChats = computed(() => {
    if (!searchTerm.value) return chats.value
    return chats.value.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    )
})

const currentChat = computed(() => {
    return chats.value.find(chat => chat.id === activeChat.value)
})

const sendMessage = () => {
    if (!newMessage.value.trim()) return

    messages.value.push({
        id: messages.value.length + 1,
        text: newMessage.value,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=João',
        name: 'Você',
        status: 'online'
    })

    newMessage.value = ''

    // Simular resposta automática
    setTimeout(() => {
        messages.value.push({
            id: messages.value.length + 1,
            text: 'Recebi sua mensagem!',
            sender: 'other',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: currentChat.value?.avatar || '',
            name: currentChat.value?.name || '',
            status: 'online'
        })
    }, 1000)
}

const selectChat = (chatId: number) => {
    activeChat.value = chatId
    // Marcar mensagens como lidas
    const chat = chats.value.find(c => c.id === chatId)
    if (chat) {
        chat.unread = 0
    }
}
</script>

<template>
    <div class="h-screen rounded-lg m-[-1rem] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <!-- Header -->
        <!-- <header class="bg-white border-b shadow-sm px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                    <h1
                        class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ChatApp
                    </h1>
                </div>
                <div class="flex items-center space-x-4">
                    <Badge variant="outline" class="px-3 py-1">
                        <div class="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Online
                    </Badge>
                    <Avatar class="cursor-pointer hover:opacity-90 transition-opacity">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header> -->

        <div class="flex flex-1 overflow-hidden rounded-md">
            <!-- Sidebar de Contatos -->
            <div class="w-full md:w-80 bg-white border-r flex flex-col">
                <!-- Busca -->
                <div class="p-4 border-b">
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input v-model="searchTerm" placeholder="Buscar conversas..."
                            class="pl-10 bg-gray-50 border-gray-200 focus-visible:ring-blue-500" />
                    </div>
                </div>

                <!-- Lista de Chats -->
                <ScrollArea class="flex-1">
                    <div class="p-2">
                        <div v-for="chat in filteredChats" :key="chat.id" @click="selectChat(chat.id)" :class="[
                            'flex items-center p-3 rounded-lg cursor-pointer transition-all mb-1',
                            activeChat === chat.id
                                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
                                : 'hover:bg-gray-50'
                        ]">
                            <div class="relative">
                                <Avatar class="h-12 w-12 border-2 border-white shadow-sm">
                                    <AvatarImage :src="chat.avatar" />
                                    <AvatarFallback>{{ chat.name.charAt(0) }}</AvatarFallback>
                                </Avatar>
                                <div :class="[
                                    'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                                    chat.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                ]"></div>
                            </div>

                            <div class="ml-3 flex-1 min-w-0">
                                <div class="flex justify-between items-center">
                                    <h3 class="font-semibold text-gray-800 truncate">{{ chat.name }}</h3>
                                    <span class="text-xs text-gray-500 whitespace-nowrap">{{ chat.timestamp }}</span>
                                </div>
                                <p class="text-sm text-gray-600 truncate">{{ chat.lastMessage }}</p>
                            </div>

                            <div v-if="chat.unread > 0" class="ml-2">
                                <Badge class="bg-blue-500 text-white px-2 py-0.5 text-xs">
                                    {{ chat.unread }}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <!-- Status do Usuário -->
                <div class="p-4 border-t bg-gray-50">
                    <div class="flex items-center">
                        <Avatar class="h-10 w-10">
                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=João" />
                            <AvatarFallback>VC</AvatarFallback>
                        </Avatar>
                        <div class="ml-3">
                            <p class="font-medium text-gray-800">Você</p>
                            <p class="text-sm text-gray-500">Disponível</p>
                        </div>
                        <Button variant="ghost" size="icon" class="ml-auto">
                            <MoreVertical class="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Área Principal do Chat -->
            <div class="flex-1 flex flex-col">
                <!-- Header do Chat Ativo -->
                <div class="bg-white border-b px-6 py-2 flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <Avatar class="h-12 w-12">
                                <AvatarImage :src="currentChat?.avatar || ''" />
                                <AvatarFallback>{{ currentChat?.name?.charAt(0) }}</AvatarFallback>
                            </Avatar>
                            <div :class="[
                                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                                currentChat?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            ]"></div>
                        </div>
                        <div>
                            <h2 class="font-bold text-lg text-gray-800">{{ currentChat?.name }}</h2>
                            <p class="text-sm text-gray-500">{{ currentChat?.status === 'online' ? 'Online' : 'Offline'
                            }}</p>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" class="text-gray-600 hover:text-blue-600">
                            <Phone class="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" class="text-gray-600 hover:text-blue-600">
                            <Video class="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" class="text-gray-600 hover:text-blue-600">
                            <MoreVertical class="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <!-- Mensagens -->
                <ScrollArea class="flex-1 p-6">
                    <div class="space-y-6 max-w-3xl mx-auto">
                        <div v-for="message in messages" :key="message.id">
                            <div :class="[
                                'flex gap-3',
                                message.sender === 'user' ? 'flex-row-reverse' : ''
                            ]">
                                <Avatar class="h-10 w-10 flex-shrink-0">
                                    <AvatarImage :src="message.avatar" />
                                    <AvatarFallback>{{ message.name.charAt(0) }}</AvatarFallback>
                                </Avatar>

                                <div :class="[
                                    'max-w-[70%]',
                                    message.sender === 'user' ? 'items-end' : ''
                                ]">
                                    <div class="flex items-center gap-2 mb-1"
                                        :class="message.sender === 'user' ? 'justify-end' : ''">
                                        <span class="text-sm font-medium text-gray-700">{{ message.name }}</span>
                                        <span class="text-xs text-gray-500">{{ message.timestamp }}</span>
                                    </div>

                                    <div :class="[
                                        'rounded-2xl px-4 py-3 shadow-sm',
                                        message.sender === 'user'
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                    ]">
                                        <p class="leading-relaxed">{{ message.text }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <Separator />

                <!-- Input de Mensagem -->
                <div class="bg-white p-4 border-t">
                    <div class="max-w-3xl mx-auto">
                        <!-- Ações rápidas -->
                        <div class="flex items-center gap-2 mb-3">
                            <Button variant="ghost" size="sm" class="text-gray-600 hover:text-blue-600">
                                <ImageIcon class="w-4 h-4 mr-1" />
                                Imagem
                            </Button>
                            <Button variant="ghost" size="sm" class="text-gray-600 hover:text-blue-600">
                                <File class="w-4 h-4 mr-1" />
                                Arquivo
                            </Button>
                            <Button variant="ghost" size="sm" class="text-gray-600 hover:text-blue-600">
                                <Mic class="w-4 h-4 mr-1" />
                                Áudio
                            </Button>
                        </div>

                        <div class="flex gap-2">
                            <div class="flex-1 relative">
                                <Input v-model="newMessage" @keyup.enter="sendMessage"
                                    placeholder="Digite sua mensagem..."
                                    class="pl-24 pr-12 py-6 rounded-full border-gray-300 focus-visible:ring-blue-500" />
                                <div class="absolute left-4 top-1/2 transform -translate-y-1/2 flex gap-2">
                                    <Button variant="ghost" size="icon"
                                        class="h-8 w-8 text-gray-500 hover:text-blue-600">
                                        <Paperclip class="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon"
                                        class="h-8 w-8 text-gray-500 hover:text-blue-600">
                                        <Smile class="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button @click="sendMessage" :disabled="!newMessage.trim()"
                                class="rounded-full px-6 py-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
                                <Send class="w-5 h-5" />
                                <span class="ml-2 hidden sm:inline">Enviar</span>
                            </Button>
                        </div>

                        <p class="text-xs text-gray-500 text-center mt-3">
                            Pressione Enter para enviar • Shift+Enter para nova linha
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Rodapé -->
        <!-- <footer class="bg-white border-t py-3 px-6">
            <div class="flex items-center justify-center text-sm text-gray-600">
                <div class="flex items-center space-x-4">
                    <span>ChatApp v1.0</span>
                    <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <span>Tailwind CSS + shadcn-vue</span>
                    <div class="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <span>Online: {{chats.filter(c => c.status === 'online').length}} usuários</span>
                </div>
            </div>
        </footer> -->
    </div>
</template>

<style scoped>
/* Estilos customizados para scrollbar */
:deep(.scrollbar-thumb) {
    background-color: #d1d5db !important;
}

:deep(.scrollbar-thumb:hover) {
    background-color: #9ca3af !important;
}
</style>