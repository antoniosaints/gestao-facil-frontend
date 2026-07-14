<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { LojaRepository } from '@/repositories/loja-repository'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoaderCircle, ShoppingBag } from 'lucide-vue-next'

const route = useRoute(); const router = useRouter(); const toast = useToast()
const slug = String(route.params.slug); const mode = computed(() => String(route.meta.customerMode || 'login'))
const loading = ref(false); const message = ref(''); const account = ref<any>(null)
const form = reactive({ name: '', email: '', phone: '', password: '', confirm: '' })
const address = reactive({ recipient: '', postalCode: '', address: '', number: '', complement: '', district: '', city: '', state: '', primary: true })
const tokenKey = `gestao-facil:loja:${slug}:access-token`

const labels: Record<string, string> = { login: 'Entrar na sua conta', register: 'Criar uma conta', forgot: 'Esqueci minha senha', reset: 'Criar nova senha', verify: 'Verificar e-mail', account: 'Minha conta' }

async function submit() {
  loading.value = true; message.value = ''
  try {
    if (mode.value === 'login') {
      const data = await LojaRepository.customerAuth(slug, 'login', { email: form.email, password: form.password })
      localStorage.setItem(tokenKey, data.accessToken); await router.push(`/lojas/${slug}/conta`)
    } else if (mode.value === 'register') {
      if (form.password !== form.confirm) throw new Error('As senhas não coincidem.')
      await LojaRepository.customerAuth(slug, 'register', { name: form.name, email: form.email, phone: form.phone, password: form.password }); message.value = 'Cadastro realizado. Abra o e-mail enviado para confirmar sua conta.'
    } else if (mode.value === 'forgot') {
      await LojaRepository.customerAuth(slug, 'forgot-password', { email: form.email }); message.value = 'Se o e-mail estiver cadastrado, as instruções foram enviadas.'
    } else if (mode.value === 'reset') {
      await LojaRepository.customerAuth(slug, 'reset-password', { token: String(route.query.token || ''), password: form.password }); message.value = 'Senha redefinida. Você já pode entrar.'
    }
  } catch (error: any) { toast.error(error?.response?.data?.message || error?.message || 'Não foi possível continuar.') } finally { loading.value = false }
}

async function saveAddress() {
  const token = localStorage.getItem(tokenKey); if (!token) return
  try { await LojaRepository.saveCustomerAddress(slug, token, address); account.value = await LojaRepository.customerMe(slug, token); Object.assign(address, { recipient: '', postalCode: '', address: '', number: '', complement: '', district: '', city: '', state: '', primary: false }); toast.success('Endereço salvo.') }
  catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível salvar o endereço.') }
}

async function removeAddress(id: number) {
  const token = localStorage.getItem(tokenKey); if (!token) return
  await LojaRepository.removeCustomerAddress(slug, token, id); account.value = await LojaRepository.customerMe(slug, token)
}

onMounted(async () => {
  if (mode.value === 'verify') {
    loading.value = true
    try { await LojaRepository.customerAuth(slug, 'verify', { token: String(route.query.token || '') }); message.value = 'E-mail verificado. Sua conta está pronta.' } catch (error: any) { message.value = error?.response?.data?.message || 'Este link não é válido.' } finally { loading.value = false }
  }
  if (mode.value === 'account') {
    const token = localStorage.getItem(tokenKey)
    if (!token) return router.push(`/lojas/${slug}/login`)
    try { account.value = await LojaRepository.customerMe(slug, token) } catch { localStorage.removeItem(tokenKey); return router.push(`/lojas/${slug}/login`) }
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 p-4">
    <Card class="w-full max-w-lg shadow-lg">
      <CardHeader class="text-center"><RouterLink :to="`/lojas/${slug}`" class="mx-auto mb-2 flex w-fit items-center gap-2 font-black text-primary"><ShoppingBag class="h-6 w-6" /> Voltar à loja</RouterLink><CardTitle>{{ labels[mode] }}</CardTitle></CardHeader>
      <CardContent>
        <div v-if="loading && (mode === 'verify' || mode === 'account')" class="flex justify-center py-12"><LoaderCircle class="h-6 w-6 animate-spin" /></div>
        <div v-else-if="mode === 'account' && account" class="space-y-5">
          <div><p class="text-xl font-bold">Olá, {{ account.nome }}</p><p class="text-sm text-muted-foreground">{{ account.email }}</p></div>
          <div><h2 class="mb-2 font-bold">Pedidos</h2><div v-if="!account.pedidos?.length" class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Você ainda não fez pedidos.</div><div v-for="order in account.pedidos" :key="order.id" class="mb-2 rounded-lg border p-3"><div class="flex justify-between"><b>{{ order.Uid }}</b><span class="text-sm">{{ order.status }}</span></div><p class="text-sm text-muted-foreground">{{ order.itens.length }} item(ns) · R$ {{ Number(order.total).toFixed(2) }}</p></div></div>
          <div><h2 class="mb-2 font-bold">Endereços</h2><div v-for="item in account.enderecos" :key="item.id" class="mb-2 flex items-start justify-between rounded-lg border p-3 text-sm"><span><b>{{ item.destinatario }}</b><br />{{ item.endereco }}, {{ item.numero }} — {{ item.cidade }}/{{ item.estado }}</span><button class="text-red-600 hover:underline" @click="removeAddress(item.id)">Remover</button></div>
            <form class="mt-3 grid gap-2 sm:grid-cols-2" @submit.prevent="saveAddress"><Input v-model="address.recipient" placeholder="Destinatário" required /><Input v-model="address.postalCode" placeholder="CEP" required /><Input v-model="address.address" class="sm:col-span-2" placeholder="Endereço" required /><Input v-model="address.number" placeholder="Número" required /><Input v-model="address.district" placeholder="Bairro" required /><Input v-model="address.city" placeholder="Cidade" required /><Input v-model="address.state" maxlength="2" placeholder="UF" required /><Button class="sm:col-span-2 text-white">Adicionar endereço</Button></form>
          </div>
        </div>
        <div v-else-if="message" class="space-y-4 rounded-lg bg-emerald-50 p-5 text-center text-emerald-900"><p>{{ message }}</p><RouterLink :to="`/lojas/${slug}/login`" class="font-bold underline">Ir para o login</RouterLink></div>
        <form v-else class="space-y-4" @submit.prevent="submit">
          <div v-if="mode === 'register'"><Label>Nome</Label><Input v-model="form.name" required /></div>
          <div v-if="mode === 'register'"><Label>Telefone</Label><Input v-model="form.phone" /></div>
          <div v-if="['login','register','forgot'].includes(mode)"><Label>E-mail</Label><Input v-model="form.email" type="email" required /></div>
          <div v-if="['login','register','reset'].includes(mode)"><Label>Senha</Label><Input v-model="form.password" type="password" minlength="8" required /></div>
          <div v-if="mode === 'register'"><Label>Confirmar senha</Label><Input v-model="form.confirm" type="password" required /></div>
          <Button class="w-full text-white" :disabled="loading"><LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />Continuar</Button>
          <div v-if="mode === 'login'" class="flex justify-between text-sm"><RouterLink :to="`/lojas/${slug}/esqueci-senha`" class="text-primary hover:underline">Esqueci a senha</RouterLink><RouterLink :to="`/lojas/${slug}/cadastro`" class="font-bold text-primary hover:underline">Criar conta</RouterLink></div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
