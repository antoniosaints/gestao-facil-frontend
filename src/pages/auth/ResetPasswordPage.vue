<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/utils/axios';
import { useToast } from 'vue-toastification';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const token = ref('');
const senha = ref('');
const confirmar = ref('');
const showPassword = ref(false);
const loading = ref(false);
const done = ref(false);

onMounted(() => {
    token.value = (route.query.token as string) || '';
});

const podeEnviar = computed(
    () => token.value && senha.value.length >= 6 && senha.value === confirmar.value,
);

async function redefinir() {
    if (!token.value) {
        toast.error('Link inválido. Solicite uma nova recuperação de senha.');
        return;
    }
    if (senha.value.length < 6) {
        toast.error('A senha precisa de ao menos 6 caracteres.');
        return;
    }
    if (senha.value !== confirmar.value) {
        toast.error('As senhas não coincidem.');
        return;
    }
    loading.value = true;
    try {
        const { data } = await http.post('/auth/redefinir-senha', { token: token.value, senha: senha.value });
        toast.success(data?.message || 'Senha redefinida com sucesso.');
        done.value = true;
        setTimeout(() => router.push('/login'), 1500);
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Não foi possível redefinir a senha.');
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-background p-6">
        <div class="w-full max-w-md space-y-8">
            <div class="flex items-center gap-3">
                <img src="/imgs/logo.png" alt="Gestão Fácil" class="h-10 w-10 rounded-xl" />
                <span class="text-lg font-bold tracking-tight text-foreground">Gestão Fácil</span>
            </div>

            <!-- Sucesso -->
            <div v-if="done" class="rounded-2xl border border-border bg-card p-8 text-center">
                <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15">
                    <ShieldCheck class="h-6 w-6" />
                </div>
                <h2 class="text-xl font-bold text-foreground">Senha redefinida!</h2>
                <p class="mt-1 text-sm text-muted-foreground">Redirecionando para o login...</p>
            </div>

            <!-- Token ausente -->
            <div v-else-if="!token" class="rounded-2xl border border-border bg-card p-8 text-center">
                <h2 class="text-xl font-bold text-foreground">Link inválido</h2>
                <p class="mt-1 text-sm text-muted-foreground">
                    Este link de recuperação é inválido ou está incompleto. Solicite um novo na tela de login.
                </p>
                <Button class="mt-5 w-full font-bold text-white dark:text-white" @click="router.push('/login')">
                    Voltar ao login
                </Button>
            </div>

            <!-- Formulário -->
            <div v-else class="space-y-6">
                <div class="space-y-2">
                    <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <KeyRound class="h-5 w-5" />
                    </div>
                    <h2 class="text-2xl font-bold tracking-tight text-foreground">Criar nova senha</h2>
                    <p class="text-sm text-muted-foreground">Escolha uma nova senha para a sua conta.</p>
                </div>

                <form @submit.prevent="redefinir" class="space-y-5">
                    <div class="space-y-2">
                        <Label for="nova-senha">Nova senha</Label>
                        <div class="relative">
                            <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="nova-senha" :type="showPassword ? 'text' : 'password'" v-model="senha"
                                placeholder="••••••••" class="h-11 pl-9 pr-9" required />
                            <button type="button" @click="showPassword = !showPassword"
                                class="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                                <Eye v-if="!showPassword" class="h-4 w-4" />
                                <EyeOff v-else class="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label for="confirmar-senha">Confirmar senha</Label>
                        <div class="relative">
                            <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="confirmar-senha" :type="showPassword ? 'text' : 'password'" v-model="confirmar"
                                placeholder="••••••••" class="h-11 pl-9" required />
                        </div>
                        <p v-if="confirmar && senha !== confirmar" class="text-xs text-destructive">
                            As senhas não coincidem.
                        </p>
                    </div>

                    <Button type="submit" class="h-11 w-full text-base font-bold text-white dark:text-white"
                        :disabled="loading || !podeEnviar">
                        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                        {{ loading ? 'Salvando...' : 'Redefinir senha' }}
                    </Button>
                </form>

                <p class="text-center text-sm">
                    <RouterLink to="/login" class="font-medium text-primary hover:text-primary/80">Voltar ao login</RouterLink>
                </p>
            </div>
        </div>
    </div>
</template>
