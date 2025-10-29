<template>
    <div
        class="bg-gradient-to-br from-white/20 to-white/10 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 min-h-screen">
        <div class="absolute inset-0 opacity-5 dark:opacity-10">
            <div class="absolute inset-0">
            </div>
        </div>
        <div class="relative z-10 container mx-auto px-0 py-0 md:px-4 md:py-8 min-h-screen flex items-center">
            <div class="max-w-6xl mx-auto">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    <!-- Left Side - Benefits -->
                    <div class="space-y-8 hidden sm:block">
                        <div>
                            <h2 class="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                                Comece sua <span class="text-blue-500">gestão inteligente</span> hoje mesmo
                            </h2>
                            <p class="text-xl text-gray-600 dark:text-gray-300">
                                Junte-se a mais de 100 lojistas que já transformaram sua gestão
                            </p>
                        </div>

                        <!-- Benefits List -->
                        <div class="space-y-6">
                            <div class="flex items-start space-x-4">
                                <div
                                    class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-check text-green-600 dark:text-green-400 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl text-gray-800 dark:text-white mb-2">7 dias grátis
                                    </h3>
                                    <p class="text-gray-600 dark:text-gray-300">Teste todas as funcionalidades sem
                                        compromisso</p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-4">
                                <div
                                    class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-bolt text-blue-600 dark:text-blue-400 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl text-gray-800 dark:text-white mb-2">Configuração
                                        rápida
                                    </h3>
                                    <p class="text-gray-600 dark:text-gray-300">Em 5 minutos você já estará vendendo</p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-4">
                                <div
                                    class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-headset text-purple-600 dark:text-purple-400 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl text-gray-800 dark:text-white mb-2">Suporte
                                        dedicado
                                    </h3>
                                    <p class="text-gray-600 dark:text-gray-300">Nossa equipe te ajuda na migração</p>
                                </div>
                            </div>

                            <div class="flex items-start space-x-4">
                                <div
                                    class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <i class="fas fa-shield-alt text-orange-600 dark:text-orange-400 text-xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl text-gray-800 dark:text-white mb-2">Dados seguros
                                    </h3>
                                    <p class="text-gray-600 dark:text-gray-300">Criptografia e backup automático</p>
                                </div>
                            </div>
                        </div>

                        <!-- Social Proof -->
                        <div
                            class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center space-x-4 mb-4">
                                <div class="flex -space-x-2">
                                    <div
                                        class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        JS</div>
                                    <div
                                        class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        MS</div>
                                    <div
                                        class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        AL</div>
                                    <div
                                        class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        +2k</div>
                                </div>
                                <div>
                                    <p class="text-gray-800 dark:text-white">Mais de 100 lojas ativas</p>
                                    <div class="flex items-center">
                                        <div class="flex text-yellow-400 mr-2">
                                            <i class="fas fa-star text-sm"></i>
                                            <i class="fas fa-star text-sm"></i>
                                            <i class="fas fa-star text-sm"></i>
                                            <i class="fas fa-star text-sm"></i>
                                            <i class="fas fa-star text-sm"></i>
                                        </div>
                                        <span class="text-sm text-gray-600 dark:text-gray-300">4.9/5 (500+
                                            avaliações)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side - Form -->
                    <div
                        class="bg-card backdrop-blur-sm rounded-none md:rounded-2xl md:shadow-2xl p-6 md:p-8 md:border border-border">
                        <div class="text-center mb-8">
                            <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Criar conta gratuita</h3>
                            <p class="text-gray-600 dark:text-gray-300">Preencha os dados abaixo para começar</p>
                        </div>

                        <form @submit.prevent="submitForm" class="space-y-6">
                            <!-- Step Indicator -->
                            <div class="flex items-center justify-center mb-8">
                                <div class="flex items-center">
                                    <!-- Step 1 -->
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                        :class="step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'">
                                        1
                                    </div>
                                    <div
                                        :class="step > 1 ? 'w-16 h-1 bg-orange-500 mx-2' : 'w-16 h-1 bg-gray-300 dark:bg-gray-600 mx-2'">
                                    </div>

                                    <!-- Step 2 -->
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                        :class="step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'">
                                        2
                                    </div>
                                    <div
                                        :class="step > 2 ? 'w-16 h-1 bg-orange-500 mx-2' : 'w-16 h-1 bg-gray-300 dark:bg-gray-600 mx-2'">
                                    </div>

                                    <!-- Step 3 -->
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                        :class="step >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'">
                                        3
                                    </div>
                                </div>
                            </div>


                            <!-- Step 1: Personal Info -->
                            <div v-show="step === 1" id="step1Form" class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nome *
                                        </label>
                                        <input type="text" v-model="store.form.firstName" required
                                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                            placeholder="Seu nome">
                                        <span v-if="errors.firstName" class="text-red-500 text-sm">Campo
                                            obrigatório</span>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Sobrenome *
                                        </label>
                                        <input type="text" v-model="store.form.lastName" required
                                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                            placeholder="Seu sobrenome">
                                        <span v-if="errors.lastName" class="text-red-500 text-sm">Campo
                                            obrigatório</span>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        E-mail *
                                    </label>
                                    <input type="email" v-model="store.form.email" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                        placeholder="seu@email.com">
                                    <span v-if="errors.email" class="text-red-500 text-sm">E-mail inválido</span>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Telefone *
                                    </label>
                                    <input type="text" v-maska="phoneMaskOptions" v-model="store.form.phone" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                        placeholder="(11) 99999-9999">
                                    <span v-if="errors.phone" class="text-red-500 text-sm">Campo obrigatório</span>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Senha *
                                    </label>
                                    <div class="relative">
                                        <input type="password" v-model="store.form.password" required
                                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 pr-12"
                                            placeholder="Mínimo 6 caracteres">
                                        <span v-if="errors.password" class="text-red-500 text-sm">Mínimo 6
                                            caracteres</span>
                                    </div>
                                    <div class="mt-2">
                                        <div class="flex items-center space-x-2 text-sm">
                                            <div class="flex space-x-1">
                                                <div v-for="n in 4" :key="n"
                                                    class="w-6 h-1 rounded transition-colors duration-300"
                                                    :class="barClass(n)"></div>
                                            </div>
                                            <span class="text-gray-500 dark:text-gray-400">
                                                {{ strengthText }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button type="button" @click="nextStep"
                                    class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center">
                                    Continuar
                                    <i class="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>

                            <!-- Step 2: Store Info -->
                            <div v-show="step === 2" id="step2Form" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nome da Loja *
                                    </label>
                                    <input type="text" v-model="store.form.storeName" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                        placeholder="Ex: Boutique Fashion">
                                    <span v-if="errors.storeName" class="text-red-500 text-sm">Campo obrigatório</span>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Segmento *
                                    </label>
                                    <select id="segment" v-model="store.form.segment" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                                        <option value="">Selecione o segmento</option>
                                        <option value="moda">Moda e Vestuário</option>
                                        <option value="assistencia">Assistência Técnica</option>
                                        <option value="eletronicos">Eletrônicos</option>
                                        <option value="alimentacao">Alimentação</option>
                                        <option value="joias">Joias e Acessórios</option>
                                        <option value="farmacia">Farmácia</option>
                                        <option value="casa">Casa e Decoração</option>
                                        <option value="beleza">Beleza e Cosméticos</option>
                                        <option value="esportes">Esportes</option>
                                        <option value="telecom">Telecomunicações</option>
                                        <option value="outros">Outros</option>
                                    </select>
                                    <span v-if="errors.segment" class="text-red-500 text-sm">Campo obrigatório</span>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            CPF/CNPJ
                                        </label>
                                        <input type="text" v-maska="cpfCnpjMaskOptions" v-model="store.form.cnpj"
                                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                            placeholder="CPF ou CNPJ">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Funcionários *
                                        </label>
                                        <select id="employees" v-model="store.form.employees" required
                                            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                                            <option value="">Selecione</option>
                                            <option value="1">Apenas eu</option>
                                            <option value="5">2 a 5 funcionários</option>
                                            <option value="10">6 a 10 funcionários</option>
                                            <option value="20">Mais de 10</option>
                                        </select>
                                        <span v-if="errors.employees" class="text-red-500 text-sm">Campo
                                            obrigatório</span>
                                    </div>
                                </div>

                                <div class="flex space-x-4">
                                    <button type="button" @click="prevStep"
                                        class="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center">
                                        <i class="fas fa-arrow-left mr-2"></i>
                                        Voltar
                                    </button>
                                    <button type="button" @click="nextStep"
                                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center">
                                        Continuar
                                        <i class="fas fa-arrow-right ml-2"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Step 3: Confirmation -->
                            <div v-show="step === 3" id="step3Form" class="space-y-4">
                                <div class="text-center">
                                    <div
                                        class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-check text-green-600 dark:text-green-400 text-2xl"></i>
                                    </div>
                                    <h4 class="text-xl text-gray-800 dark:text-white mb-2">Quase pronto!
                                    </h4>
                                    <p class="text-gray-600 dark:text-gray-300">Revise suas informações e confirme o
                                        cadastro</p>
                                </div>

                                <!-- Summary -->
                                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">Nome:</span>
                                        <span id="summaryName" class="text-gray-800 dark:text-white">
                                            {{ store.form.firstName }} {{ store.form.lastName }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">E-mail:</span>
                                        <span id="summaryEmail" class="text-gray-800 dark:text-white">
                                            {{ store.form.email }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">Loja:</span>
                                        <span id="summaryStore" class="text-gray-800 dark:text-white">
                                            {{ store.form.storeName }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">Segmento:</span>
                                        <span id="summarySegment" class="text-gray-800 dark:text-white">
                                            {{ store.form.segment }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Terms -->
                                <div class="space-y-4">
                                    <label class="flex items-start space-x-3">
                                        <input type="checkbox" v-model="store.form.terms" required
                                            class="mt-1 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                                        <span class="text-sm text-gray-600 dark:text-gray-300">
                                            Aceito os <RouterLink to="/site/termos-politica"
                                                class="text-blue hover:underline">Termos de Uso</RouterLink>
                                            e
                                            <RouterLink to="/site/termos-politica" class="text-blue hover:underline">
                                                Política de Privacidade</RouterLink>
                                        </span>
                                        <span v-if="errors.terms" class="text-red-500 text-sm">Campo obrigatório</span>
                                    </label>

                                    <label class="flex items-start space-x-3">
                                        <input type="checkbox" id="newsletter"
                                            class="mt-1 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                                        <span class="text-sm text-gray-600 dark:text-gray-300">
                                            Quero receber dicas e novidades por e-mail
                                        </span>
                                    </label>
                                </div>

                                <div class="flex space-x-4">
                                    <button type="button" @click="prevStep"
                                        class="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center">
                                        <i class="fas fa-arrow-left mr-2"></i>
                                        Voltar
                                    </button>
                                    <button type="submit" id="submitForm"
                                        class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition-colors duration-200 flex items-center justify-center">
                                        <i class="fas fa-rocket mr-2"></i>
                                        Criar Conta Grátis
                                    </button>
                                </div>
                            </div>
                        </form>

                        <!-- Footer -->
                        <div class="mt-8 text-center">
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                Já tem uma conta?
                                <RouterLink to="/login"
                                    class="text-blue-500 hover:text-blue-600 transition-colors duration-200">
                                    Clique aqui para entrar
                                </RouterLink>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ContaRepository } from '@/repositories/conta-repository';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { vMaska } from 'maska/vue';
import { cpfCnpjMaskOptions, phoneMaskOptions } from '@/lib/imaska';
import { useAccountCreateStore } from '@/stores/login/useCreateAccount';
const router = useRouter();
const toast = useToast();
const store = useAccountCreateStore();
// Step atual
const step = ref(1);

// Validação simples
const errors = ref({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    storeName: false,
    segment: false,
    employees: false,
    terms: false
});

const validateStep1 = () => {
    errors.value.firstName = !store.form.firstName;
    errors.value.lastName = !store.form.lastName;
    errors.value.email = !store.form.email || !/^\S+@\S+\.\S+$/.test(store.form.email);
    errors.value.phone = !store.form.phone;
    errors.value.password = !store.form.password || store.form.password.length < 6;

    return !Object.values(errors.value).some((e, idx) => idx < 5 && e);
};

const validateStep2 = () => {
    errors.value.storeName = !store.form.storeName;
    errors.value.segment = !store.form.segment;
    errors.value.employees = !store.form.employees;

    return !errors.value.storeName && !errors.value.segment && !errors.value.employees;
};

const validateStep3 = () => {
    errors.value.terms = !store.form.terms;
    return !errors.value.terms;
};

// Navegação entre steps
const nextStep = () => {
    if (step.value === 1 && validateStep1()) step.value++;
    else if (step.value === 2 && validateStep2()) step.value++;
};

const prevStep = () => {
    if (step.value > 1) step.value--;
};

const strength = computed(() => {
    let score = 0
    if (store.form.password.length >= 6) score++
    if (/[A-Z]/.test(store.form.password)) score++
    if (/[0-9]/.test(store.form.password)) score++
    if (/[^A-Za-z0-9]/.test(store.form.password)) score++
    return score
})

const strengthText = computed(() => {
    switch (strength.value) {
        case 0:
        case 1:
            return 'Fraca'
        case 2:
            return 'Média'
        case 3:
            return 'Forte'
        case 4:
            return 'Muito forte'
        default:
            return 'Força da senha'
    }
})
function barClass(n: number) {
    if (strength.value >= n) {
        if (strength.value <= 1) return 'bg-red-500'
        if (strength.value === 2) return 'bg-yellow-500'
        if (strength.value === 3) return 'bg-green-500'
        return 'bg-emerald-600'
    }
    return 'bg-gray-300 dark:bg-gray-600'
}
const submitForm = async () => {
    if (validateStep3()) {
        try {
            await ContaRepository.create({
                nome: store.form.firstName + " " + store.form.lastName,
                cpfCnpj: store.form.cnpj,
                conta: store.form.storeName,
                telefone: store.form.phone,
                dicasNovidades: store.form.newsletter,
                email: store.form.email,
                senha: store.form.password,
                funcionarios: Number(store.form.employees),
                tipo: store.form.segment
            });
            toast.success("Conta criada com sucesso!");
            router.push("/login");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar conta, tente novamente.");
        }
    }
};

onMounted(() => {
    store.form.employees ? step.value = 3 : step.value = 1
});
</script>