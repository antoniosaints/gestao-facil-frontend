<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/login/useAuthStore';
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff, User, ArrowRight, Star } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

// Shadcn Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const store = useAuthStore();
const router = useRouter();

const login = ref({
    email: '',
    password: ''
});

const showPassword = ref(false);
const loading = ref(false);
const showForgotPasswordDialog = ref(false);
const saveDataLogin = ref<boolean>(localStorage.getItem('gestao_facil:credentials_login') == 'true' || false);

// Testimonials (Reused or updated)
const testimonials = [
    {
        name: 'Maria Silva',
        initials: 'MS',
        text: 'Desde que comecei a usar o Gestão Fácil, minha loja cresceu 150%. A interface é muito intuitiva!',
        store: 'Boutique Fashion'
    },
    {
        name: 'Joaquim Santos',
        initials: 'JS',
        text: 'O Gestão Fácil facilitou meu trabalho de vendas. Ele me ajudou a gerenciar minha loja de forma eficiente.',
        store: 'JS Assistência Técnica'
    },
    {
        name: 'Ana Oliveira',
        initials: 'AO',
        text: 'A Gestão Fácil me ajudou a gerenciar minha loja de forma simples e eficiente. Recomendado!',
        store: 'Bazar da Ana'
    }
];

const currentTestimonial = ref(testimonials[0]);

onMounted(() => {
    // Rotate testimonials every 5 seconds
    setInterval(() => {
        const currentIndex = testimonials.indexOf(currentTestimonial.value);
        const nextIndex = (currentIndex + 1) % testimonials.length;
        currentTestimonial.value = testimonials[nextIndex];
    }, 5000);
});

async function loginUsuario() {
    loading.value = true;
    try {
        localStorage.setItem('gestao_facil:credentials_login', saveDataLogin.value.toString());
        await store.login(login.value.email, login.value.password);
        // Redirect handled by store or router if needed, assuming store handles it
    } catch (error) {
        console.error("Login faile", error);
    } finally {
        loading.value = false;
    }
}

function togglePasswordVisibility() {
    showPassword.value = !showPassword.value;
}
</script>

<template>
    <div class="min-h-screen grid lg:grid-cols-2">

        <!-- Left Side (Visual) -->
        <div class="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
            <!-- Background Decoration -->
            <div class="absolute inset-0 z-0">
                <div
                    class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow">
                </div>
                <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 animate-pulse-slow"
                    style="animation-delay: 2s"></div>
            </div>

            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-12">
                    <div
                        class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                        G</div>
                    <span class="font-bold text-xl tracking-tight">Gestão Fácil</span>
                </div>

                <div class="space-y-6 max-w-lg">
                    <h1 class="text-5xl font-extrabold tracking-tight leading-tight">
                        Bem-vindo de volta ao seu <span class="text-primary">negócio</span>.
                    </h1>
                    <p class="text-xl text-zinc-400">
                        Acesse sua conta e continue gerenciando sua loja com facilidade e eficiência.
                    </p>
                </div>
            </div>

            <!-- Dynamic Testimonial -->
            <div
                class="relative z-10 mt-12 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm transition-opacity duration-500">
                <div class="flex gap-1 text-yellow-500 mb-4">
                    <Star v-for="n in 5" :key="n" class="w-4 h-4 fill-current" />
                </div>
                <p class="text-lg italic mb-6">"{{ currentTestimonial.text }}"</p>
                <div class="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback>{{ currentTestimonial.initials }}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p class="font-bold text-sm">{{ currentTestimonial.name }}</p>
                        <p class="text-xs text-zinc-400">{{ currentTestimonial.store }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Side (Form) -->
        <div class="bg-background flex flex-col justify-center p-6 lg:p-12 relative">
            <div class="absolute top-6 right-6 lg:hidden">
                <div class="flex items-center gap-2">
                    <div
                        class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        G</div>
                </div>
            </div>

            <div class="max-w-md mx-auto w-full space-y-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold tracking-tight">Entrar na sua conta</h2>
                    <p class="text-muted-foreground mt-2">Digite suas credenciais para continuar</p>
                </div>

                <form @submit.prevent="loginUsuario" class="space-y-6">
                    <div class="space-y-2">
                        <Label for="email">E-mail</Label>
                        <div class="relative">
                            <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="email" type="email" v-model="login.email" placeholder="seu@email.com"
                                class="pl-9" required />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <Label for="password">Senha</Label>
                            <span @click="showForgotPasswordDialog = true"
                                class="text-sm font-medium text-primary hover:text-primary/80 cursor-pointer">
                                Esqueceu a senha?
                            </span>
                        </div>
                        <div class="relative">
                            <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="password" :type="showPassword ? 'text' : 'password'" v-model="login.password"
                                placeholder="••••••••" class="pl-9 pr-9" required />
                            <button type="button" @click="togglePasswordVisibility"
                                class="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                                <Eye v-if="!showPassword" class="h-4 w-4" />
                                <EyeOff v-else class="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <Checkbox id="remember" :checked="saveDataLogin"
                            @update:checked="(val: boolean) => saveDataLogin = val" />
                        <label for="remember"
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Lembrar de mim
                        </label>
                    </div>

                    <Button type="submit" class="w-full h-11 text-base font-bold text-white dark:text-white"
                        :disabled="loading">
                        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                        <LogIn v-else class="mr-2 h-4 w-4" />
                        {{ loading ? 'Entrando...' : 'Entrar' }}
                    </Button>
                </form>

                <div class="text-center text-sm text-muted-foreground">
                    Não tem uma conta?
                    <RouterLink to="/site/cadastro"
                        class="font-medium text-primary hover:text-primary/80 underline underline-offset-4">
                        Cadastre-se gratuitamente
                    </RouterLink>
                </div>
            </div>
        </div>

        <!-- Dialog: Recuperar Senha -->
        <Dialog v-model:open="showForgotPasswordDialog">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Recuperar Senha</DialogTitle>
                    <DialogDescription>
                        Digite o e-mail associado à sua conta para receber as instruções de recuperação.
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid gap-2">
                        <Label for="reset-email">E-mail</Label>
                        <Input id="reset-email" placeholder="seu@email.com" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" @click="showForgotPasswordDialog = false">Cancelar</Button>
                    <Button type="submit" class="text-white dark:text-white font-bold">Enviar Instruções</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
</template>

<style scoped>
.animate-pulse-slow {
    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>