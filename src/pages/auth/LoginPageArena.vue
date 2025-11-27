<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/login/useAuthStore';
import { Loader, LogIn, MapPinned } from 'lucide-vue-next';
import { ref } from 'vue';
const store = useAuthStore();
const login = ref({
    email: '',
    password: ''
});
const textLogin = ref('Entrar');
const iconLogin = ref(LogIn);
const showForgotPasswordModal = ref(false);
const saveDataLogin = ref<boolean>(localStorage.getItem('gestao_facil:credentials_login') == 'true' || false);

const testemonials = [
    {
        name: 'Mariana Souza',
        slug: 'MS',
        text: 'O Arena ERP transformou a gestão das minhas quadras. Hoje controlo reservas, horários e pagamentos sem complicações.',
        arena: 'Arena Beach Pro'
    },
    {
        name: 'Ricardo Almeida',
        slug: 'RA',
        text: 'Com o Arena ERP reduzi conflitos de horários e aumentei a taxa de ocupação das quadras. Sistema essencial.',
        arena: 'RA Esportes'
    },
    {
        name: 'Ana Ribeiro',
        slug: 'AR',
        text: 'A agenda inteligente do Arena ERP facilitou muito minha rotina. Hoje todo o fluxo de reservas está organizado.',
        arena: 'Arena Master'
    },
    {
        name: 'Pedro Martins',
        slug: 'PM',
        text: 'O controle financeiro integrado me deu uma visão clara da receita diária das quadras. Excelente ferramenta.',
        arena: 'PM Beach Arena'
    },
    {
        name: 'Carolina Mendes',
        slug: 'CM',
        text: 'Finalmente consegui centralizar reservas, clientes e pagamentos. O Arena ERP trouxe profissionalismo à minha arena.',
        arena: 'Arena Carolina'
    },
    {
        name: 'Rafael Lima',
        slug: 'RL',
        text: 'A automatização das confirmações de reservas reduziu drasticamente cancelamentos de última hora.',
        arena: 'Lima Sports Center'
    },
    {
        name: 'Fernanda Rocha',
        slug: 'FR',
        text: 'O suporte foi decisivo. Em poucos dias consegui organizar todo o fluxo das quadras. Recomendo.',
        arena: 'Beach Point'
    },
    {
        name: 'Lucas Amaral',
        slug: 'LA',
        text: 'O Arena ERP me permitiu focar na expansão da arena enquanto o sistema cuida da operação diária.',
        arena: 'Arena Amaral'
    },
    {
        name: 'Juliana Ferreira',
        slug: 'JF',
        text: 'O sistema é rápido e muito intuitivo. Reservas ficaram extremamente simples para minha equipe.',
        arena: 'JF Sports Arena'
    },
    {
        name: 'Marcos Pereira',
        slug: 'MP',
        text: 'Agora consigo acompanhar tudo pelo celular: reservas, recebimentos e ocupação das quadras. Excelente solução.',
        arena: 'MP Quadras'
    }
];

const randomTestimonial = ref(
    testemonials[Math.floor(Math.random() * testemonials.length)]
);

async function loginUsuario() {
    textLogin.value = 'Entrando...';
    iconLogin.value = Loader;
    localStorage.setItem('gestao_facil:credentials_login', saveDataLogin.value.toString());
    await store.login(login.value.email, login.value.password);
    textLogin.value = 'Entrar';
    iconLogin.value = LogIn;
}

</script>
<template>
    <div
        class="bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900 dark:to-teal-800 transition-colors duration-300 min-h-screen">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-5 dark:opacity-10">
            <div class="absolute inset-0">
            </div>
        </div>

        <div class="relative z-10 container mx-auto px-4 py-8 min-h-screen flex items-center">
            <div class="max-w-6xl mx-auto w-full">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    <!-- Left Side - Welcome Message & Features -->
                    <div class="space-y-4 hidden sm:block">
                        <div>
                            <h2 class="text-5xl font-bold text-gray-800 dark:text-white mb-6 leading-tight">
                                Bem-vindo de volta à sua
                                <span
                                    class="text-teal-800 bg-gradient-to-r dark:from-teal-400 dark:to-teal-200 from-teal-600 to-teal-700 bg-clip-text text-transparent">
                                    arena
                                </span>
                            </h2>
                            <p class="text-xl text-gray-600 dark:text-gray-300">
                                Acesse sua conta e continue gerenciando sua loja com facilidade
                            </p>
                        </div>

                        <!-- Quick Stats -->
                        <div class="grid grid-cols-2 gap-6">
                            <div
                                class="bg-teal-100 dark:bg-teal-950 backdrop-blur-sm rounded-xl p-6 border border-teal-500 dark:border-teal-800">
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                                        <MapPinned class="h-6 w-6 text-teal-500" :stroke-width="2.5" />
                                    </div>
                                    <div>
                                        <p class="text-2xl font-bold text-gray-800 dark:text-white">50+</p>
                                        <p class="text-gray-600 dark:text-gray-300 text-sm">arenas ativas</p>
                                    </div>
                                </div>
                            </div>

                            <div
                                class="bg-teal-100 dark:bg-teal-950 backdrop-blur-sm rounded-xl p-6 border border-teal-500 dark:border-teal-800">
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
                                        class="w-8 h-8 bg-success text-white rounded-lg flex items-center justify-center">
                                        <i class="fas fa-check text-primary-600 dark:text-primary-400"></i>
                                    </div>
                                    <span class="text-gray-700 dark:text-gray-300">
                                        Agendar horários e controlar reservas
                                    </span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-success text-white rounded-lg flex items-center justify-center">
                                        <i class="fas fa-check text-primary-600 dark:text-primary-400"></i>
                                    </div>
                                    <span class="text-gray-700 dark:text-gray-300">
                                        Gerenciar produtos com estoque
                                        baixo
                                    </span>
                                </div>
                                <div class="flex items-center space-x-3">
                                    <div
                                        class="w-8 h-8 bg-success text-white rounded-lg flex items-center justify-center">
                                        <i class="fas fa-check text-primary-600 dark:text-primary-400"></i>
                                    </div>
                                    <span class="text-gray-700 dark:text-gray-300">
                                        Acompanhar pedidos em tempo
                                        real
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Testimonial -->
                        <div
                            class="bg-teal-100 dark:bg-teal-950 backdrop-blur-sm rounded-xl p-6 border border-teal-500 dark:border-teal-800">
                            <div class="flex items-center space-x-4">
                                <div
                                    class="w-12 h-12 bg-gradient-to-br p-4 from-teal-600 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {{ randomTestimonial.slug }}
                                </div>
                                <div>
                                    <p class="text-gray-700 dark:text-gray-300 italic mb-2">
                                        "{{ randomTestimonial.text }}"
                                    </p>
                                    <div class="flex items-center space-x-2">
                                        <span class="font-semibold text-gray-800 dark:text-white">
                                            {{ randomTestimonial.name }}
                                        </span>
                                        <span class="text-gray-500 dark:text-gray-400">•</span>
                                        <span class="text-sm text-gray-600 dark:text-gray-400">
                                            {{ randomTestimonial.arena }}
                                        </span>
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
                                class="bg-teal-100 dark:bg-teal-950 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-teal-500 dark:border-teal-800">

                                <!-- Form Header -->
                                <div class="text-center mb-8">
                                    <div
                                        class="w-16 h-16 bg-gradient-to-br from-primary to-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <img class="rounded-sm" src="/imgs/favicon_arena.png" alt="logo">
                                    </div>
                                    <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                        Entrar na sua conta
                                    </h3>
                                    <p class="text-gray-600 dark:text-gray-300">
                                        Digite suas credenciais para continuar
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
                                            <input type="checkbox" v-model="saveDataLogin"
                                                class="w-4 h-4 text-primary-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500">
                                            <span class="text-sm text-gray-600 dark:text-gray-300">Lembrar de mim</span>
                                        </label>
                                        <a href="javascript:void(0)" @click="showForgotPasswordModal = true"
                                            class="text-sm text-primary-500 hover:text-primary-600 transition-colors duration-200">
                                            Esqueceu a senha?
                                        </a>
                                    </div>

                                    <!-- Login Button -->
                                    <Button type="submit"
                                        class="w-full bg-gradient-to-r h-30 from-teal-500/80 to-teal-500 hover:from-teal-500/90 hover:to-teal-500/80 text-white py-3 rounded-lg text-lg transition-all duration-200 transform shadow-lg hover:shadow-xl">
                                        <component :is="iconLogin" class="w-8 h-8 mr-2" />
                                        {{ textLogin }}
                                    </Button>
                                </form>
                                <!-- Footer -->
                                <div class="mt-8 text-center">
                                    <p class="text-sm text-gray-600 dark:text-gray-400">
                                        Não tem uma conta?
                                        <RouterLink to="/site/cadastro"
                                            class="text-teal-800 dark:text-teal-400 hover:text-teal-600 transition-colors duration-200">
                                            Cadastre-se gratuitamente
                                        </RouterLink>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Forgot Password Modal -->
        <div v-if="showForgotPasswordModal"
            class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300"
                :class="showForgotPasswordModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'">
                <div class="text-center mb-6">
                    <div
                        class="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-key text-orange-600 dark:text-orange-400 text-2xl"></i>
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
                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                            placeholder="seu@email.com">
                    </div>

                    <div class="flex space-x-4">
                        <button type="button" @click="showForgotPasswordModal = false"
                            class="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                            Cancelar
                        </button>
                        <button type="submit"
                            class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                            Enviar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>