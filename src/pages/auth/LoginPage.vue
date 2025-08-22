<script setup lang="ts">
import { useAuthStore } from '@/stores/login/useAuthStore';
import { useColorMode } from '@vueuse/core';
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
const backgroundURL = ref('data:image/svg+xml,<svg width=" 60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23f97316" fill-opacity="0.1"> <circle cx="7" cy="7" r="7" /> <circle cx="53" cy="7" r="7" /><circle cx="7" cy="53" r="7" /><circle cx="53" cy="53" r="7" /></g></g></svg>');
const store = useAuthStore();
const toast = useToast();
const login = ref({
    email: '',
    password: ''
});

const color = useColorMode();

const showForgotPasswordModal = ref(false);

const testemonials = [
    {
        name: 'Maria Silva',
        slug: 'MS',
        text: 'Desde que comecei a usar o Gestão Fácil, minha loja cresceu 150%. A interface é muito intuitiva!',
        store: 'Boutique Fashion'
    },
    {
        name: 'Joaquim Santos',
        slug: 'JS',
        text: 'O Gestão Fácil facilitou meu trabalho de vendas. Ele me ajudou a gerenciar minha loja de forma eficiente.',
        store: 'JS Assistência Técnica'
    },
    {
        name: 'Ana Oliveira',
        slug: 'AO',
        text: 'A Gestão Fácil me ajudou a gerenciar minha loja de forma simples e eficiente. Recomendado!',
        store: 'Bazar da Ana'
    },
    {
        name: 'Pedro Costa',
        slug: 'PC',
        text: 'Precisava de uma ferramenta simples para gerenciar minha loja, e o Gestão Fácil me ajudou!',
        store: 'PC Tech'
    }
];

const getOnTestemonials = () => {
    return testemonials[Math.floor(Math.random() * testemonials.length)];
}

async function loginUsuario() {
    try {
        await store.login(login.value.email, login.value.password);
        toast.success('Login efetuado com sucesso!');
    } catch (error) {
        console.log(error);
        toast.error('Erro ao efetuar login!');
    }
}

</script>
<template>
    <div
        class="bg-gradient-to-br from-primary-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 min-h-screen">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-5 dark:opacity-10">
            <div class="absolute inset-0" :style="{ backgroundImage: `url(${backgroundURL})` }">
            </div>
        </div>

        <div class="relative z-10 container mx-auto px-4 py-8 min-h-screen flex items-center">
            <div class="max-w-6xl mx-auto w-full">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    <!-- Left Side - Welcome Message & Features -->
                    <div class="space-y-8 hidden sm:block">
                        <div>
                            <h2 class="text-5xl font-bold text-gray-800 dark:text-white mb-6 leading-tight">
                                Bem-vindo de volta ao seu
                                <span
                                    class="text-primary-500 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                                    negócio
                                </span>
                            </h2>
                            <p class="text-xl text-gray-600 dark:text-gray-300">
                                Acesse sua conta e continue gerenciando sua loja com facilidade
                            </p>
                        </div>

                        <!-- Quick Stats -->
                        <div class="grid grid-cols-2 gap-6">
                            <div
                                class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-users text-blue-600 dark:text-blue-400 text-xl"></i>
                                    </div>
                                    <div>
                                        <p class="text-2xl font-bold text-gray-800 dark:text-white">100+</p>
                                        <p class="text-gray-600 dark:text-gray-300 text-sm">Lojas ativas</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-chart-line text-green-600 dark:text-green-400 text-xl"></i>
                                    </div>
                                    <div>
                                        <p class="text-2xl font-bold text-gray-800 dark:text-white">98%</p>
                                        <p class="text-gray-600 dark:text-gray-300 text-sm">Satisfação</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Features Preview -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">O que você pode fazer hoje:
                            </h3>
                            <div class="space-y-3">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-check text-primary-600 dark:text-primary-400"></i>
                                    </div>
                                    <span class="text-gray-700 dark:text-gray-300">Visualizar relatório de vendas do
                                        mês</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-check text-primary-600 dark:text-primary-400"></i>
                                    </div>
                                    <span class="text-gray-700 dark:text-gray-300">Gerenciar produtos com estoque
                                        baixo</span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-check text-primary-600 dark:text-primary-400"></i>
                                    </div>
                                    <span class="text-gray-700 dark:text-gray-300">Acompanhar pedidos em tempo
                                        real</span>
                                </div>
                            </div>
                        </div>

                        <!-- Testimonial -->
                        <div
                            class="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                            <div class="flex items-start space-x-4">
                                <div
                                    class="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {{ getOnTestemonials().slug }}
                                </div>
                                <div>
                                    <p class="text-gray-700 dark:text-gray-300 italic mb-2">
                                        "{{ getOnTestemonials().text }}"
                                    </p>
                                    <div class="flex items-center space-x-2">
                                        <span
                                            class="font-semibold text-gray-800 dark:text-white">{{ getOnTestemonials().name }}</span>
                                        <span class="text-gray-500 dark:text-gray-400">•</span>
                                        <span
                                            class="text-sm text-gray-600 dark:text-gray-400">{{ getOnTestemonials().store }}</span>
                                        <div class="flex text-yellow-400 ml-2">
                                            <i class="fas fa-star text-xs"></i>
                                            <i class="fas fa-star text-xs"></i>
                                            <i class="fas fa-star text-xs"></i>
                                            <i class="fas fa-star text-xs"></i>
                                            <i class="fas fa-star text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side - Login Form -->
                    <div class="flex justify-center lg:justify-end">
                        <div class="w-full max-w-md">
                            <div
                                class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">

                                <!-- Form Header -->
                                <div class="text-center mb-8">
                                    <div
                                        class="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-user text-white text-2xl"></i>
                                    </div>
                                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Entrar na sua
                                        conta
                                    </h3>
                                    <p class="text-gray-600 dark:text-gray-300">Digite suas credenciais para continuar
                                    </p>
                                </div>

                                <!-- Login Form -->
                                <form @submit.prevent="loginUsuario" id="loginFormularioSistemaSubmit"
                                    class="space-y-6">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            E-mail
                                        </label>
                                        <div class="relative">
                                            <input v-model="login.email" type="email" name="email" required
                                                class="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                                                placeholder="seu@email.com">
                                            <i
                                                class="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Senha
                                        </label>
                                        <div class="relative">
                                            <input v-model="login.password" type="password" name="password" required
                                                class="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                                                placeholder="Sua senha">
                                            <i
                                                class="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                            <button type="button" id="togglePassword"
                                                class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Remember Me & Forgot Password -->
                                    <div class="flex items-center justify-between">
                                        <label class="flex items-center space-x-2">
                                            <input type="checkbox" id="remember"
                                                class="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500">
                                            <span class="text-sm text-gray-600 dark:text-gray-300">Lembrar de mim</span>
                                        </label>
                                        <a href="javascript:void(0)" id="forgotPassword"
                                            class="text-sm text-primary-500 hover:text-primary-600 transition-colors duration-200">
                                            Esqueceu a senha?
                                        </a>
                                    </div>

                                    <!-- Login Button -->
                                    <button type="submit"
                                        class="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                                        <i class="fas fa-sign-in-alt mr-2"></i>
                                        Entrar
                                    </button>
                                </form>
                                <!-- Footer -->
                                <div class="mt-8 text-center">
                                    <p class="text-sm text-gray-600 dark:text-gray-400">
                                        Não tem uma conta?
                                        <a href="/site/cadastro"
                                            class="text-primary-500 hover:text-primary-600 font-semibold transition-colors duration-200">
                                            Cadastre-se gratuitamente
                                        </a>
                                    </p>
                                </div>

                                <!-- Security Badge -->
                                <div
                                    class="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                    <i class="fas fa-shield-alt text-green-500"></i>
                                    <span>Conexão segura SSL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Forgot Password Modal -->
        <div v-if="showForgotPasswordModal"
            class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center hidden">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 opacity-0"
                id="modalContent">
                <div class="text-center mb-6">
                    <div
                        class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-key text-blue-600 dark:text-blue-400 text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Recuperar senha</h3>
                    <p class="text-gray-600 dark:text-gray-300">Digite seu e-mail para receber as instruções</p>
                </div>

                <form id="forgotPasswordForm" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            E-mail cadastrado
                        </label>
                        <input type="email" id="forgotEmail" required
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            placeholder="seu@email.com">
                    </div>

                    <div class="flex space-x-4">
                        <button type="button" id="closeForgotModal"
                            class="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                            Cancelar
                        </button>
                        <button type="submit"
                            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                            Enviar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>