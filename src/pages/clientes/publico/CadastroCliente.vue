<template>
  <div
    class="w-screen mx-auto h-screen flex items-center bg-gradient-to-br from-primary to-primary/80 justify-center py-6"
  >
    <Card
      v-if="!conta && !notAcceptId"
      class="p-6 flex flex-col rounded-none md:rounded-xl h-screen md:h-max w-screen md:w-2/3 lg:w-2/4 xl:w-2/6"
    >
      <div class="flex flex-col items-center justify-center gap-3 h-screen md:h-full">
        <FileSymlink class="h-12 w-12 text-primary animate-pulse" />
        <h1 class="text-3xl font-bold text-center text-primary">
          Olá, estamos carregando as informações
        </h1>
        <LoaderIcon class="h-12 w-12 text-primary animate-spin" />
        <p>Logo o formulário estará disponível para preencher 🎉🔥...</p>
      </div>
    </Card>
    <Card
      v-if="contaId && notAcceptId"
      class="p-6 flex flex-col rounded-none md:rounded-xl h-screen md:h-max w-screen md:w-2/3 lg:w-2/4 xl:w-2/6"
    >
      <div class="flex flex-col items-center justify-center gap-4 h-screen md:h-full">
        <ShieldX class="h-12 w-12 text-danger animate-ping mb-4" />
        <h1 class="text-3xl font-bold text-center text-danger">
          Oops, parece que o link não é válido.
        </h1>
        <p>Verifique com o administrador do sistema e peça um novo link.</p>
      </div>
    </Card>

    <Card
      v-else-if="conta && !cadastroEfetuado"
      class="p-6 flex flex-col rounded-none md:rounded-xl h-screen md:h-max w-screen md:w-2/3 lg:w-2/4 xl:w-2/6"
    >
      <CardHeader class="px-0 py-4 pt-0">
        <div class="flex items-center gap-4">
          <img class="rounded-full w-12 h-12 bg-gray-500" :src="logo" alt="logo.png" />
          <div>
            <CardTitle class="text-2xl">Cadastre-se na {{ conta.nome }}</CardTitle>
            <CardDescription>Preencha os campos abaixo</CardDescription>
          </div>
        </div>
      </CardHeader>

      <form @submit.prevent="onSubmit" class="space-y-2">
        <div>
          <Label for="name">Nome *</Label>
          <Input id="name" v-model="form.name" placeholder="Digite seu nome" required />
          <p v-if="errors.name" class="text-sm text-red-500 mt-1">{{ errors.name }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label for="email">Email *</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Digite seu email"
              required
            />
            <p v-if="errors.email" class="text-sm text-red-500 mt-1">{{ errors.email }}</p>
          </div>
          <div>
            <Label for="telefone">Telefone</Label>
            <Input
              id="telefone"
              v-model="form.telefone"
              placeholder="Digite seu telefone"
              inputmode="tel"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label for="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              v-model="form.whatsapp"
              placeholder="Digite seu WhatsApp"
              inputmode="tel"
            />
          </div>
          <div>
            <Label for="cep">CEP</Label>
            <Input id="cep" v-model="form.cep" placeholder="Digite seu CEP" maxlength="9" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label for="cidade">Cidade</Label>
            <Input id="cidade" v-model="form.cidade" placeholder="Digite sua cidade" />
          </div>
          <div>
            <Label for="estado">Estado</Label>
            <Select v-model="form.estado">
              <SelectTrigger>
                <SelectValue placeholder="Escolha o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="uf in estados" :key="uf" :value="uf">{{ uf }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label for="endereco">Endereço</Label>
          <Input id="endereco" v-model="form.endereco" placeholder="Digite seu endereço" />
        </div>

        <div>
          <Label for="observacao">Observação</Label>
          <Textarea
            id="observacao"
            v-model="form.observacao"
            rows="4"
            placeholder="Digite suas observações"
          />
        </div>

        <div class="flex items-center justify-between pt-2">
          <Button class="bg-secondary" variant="ghost" type="button" @click="reset">
            <Eraser />
            Limpar
          </Button>
          <Button type="submit" :disabled="submitting || canSubmit">
            <Save />
            {{ submitting ? 'Enviando...' : 'Cadastrar' }}
          </Button>
        </div>
      </form>
    </Card>

    <Card
      v-else-if="conta && cadastroEfetuado && yourId"
      class="p-6 flex flex-col rounded-none md:rounded-xl h-screen md:h-max w-screen md:w-2/3 lg:w-2/4 xl:w-2/6"
    >
      <div class="flex flex-col items-center justify-center text-center gap-3 h-screen md:h-full">
        <BadgeCheck class="h-12 w-12 text-primary animate-pulse" />
        <h1 class="text-3xl font-bold text-center text-primary">Seu cadastro foi finalizado</h1>
        <p>
          Seu id é <span class="italic text-blue-700">{{ yourId }}</span
          >, informe para o responsável do link 🎉🔥...
        </p>
        <Button type="button" @click="copiarMeuId(yourId)" class="text-white">
          <Copy />
          Copiar meu ID
        </Button>
        <p class="text-muted-foreground text-xs">
          Está buscando um sistema ERP em núvem para gerenciar seu negócio?, faça sua conta no
          Gestão fácil ERP e teste sem compromisso.
          <RouterLink class="text-blue-700" to="/site/cadastro"> Acesse aqui </RouterLink>
        </p>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type Contas } from '@/types/schemas'
import http from '@/utils/axios'
import { HashGenerator } from '@/utils/generators'
import { BadgeCheck, Copy, Eraser, FileSymlink, LoaderIcon, Save, ShieldX } from 'lucide-vue-next'
import { reactive, ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { POSITION, useToast } from 'vue-toastification'

const estados = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

const form = reactive<any>({
  name: '',
  email: '',
  telefone: '',
  whatsapp: '',
  cidade: '',
  estado: '',
  cep: '',
  endereco: '',
  observacao: '',
})

const route = useRoute()
const toast = useToast()
const errors = reactive<any>({})
const submitting = ref(false)
const canSubmit = ref(false)
const resultOk = ref(false)
const contaId = ref(route.params.contaId)
const conta = ref<Contas | null>(null)
const yourId = ref(null)
const cadastroEfetuado = ref(false)
const notAcceptId = ref(false)

const logo = computed(() => {
  const url = import.meta.env.VITE_BACKEND_URL
  return url + '/' + conta.value?.profile + '?_t=' + Date.now()
})

function validate() {
  errors.name = form.name.trim() ? '' : 'Nome é obrigatório.'
  errors.email = /^\S+@\S+\.\S+$/.test(form.email || '') ? '' : 'Email inválido.'
  return !errors.name && !errors.email
}

function copiarMeuId(id: string) {
  navigator.clipboard.writeText(id)
  toast.info('ID copiado!', {
    timeout: 5000,
    position: POSITION.BOTTOM_CENTER,
  })
}

async function fetchConta() {
  try {
    canSubmit.value = false
    if (!contaId.value)
      return toast.error(
        'O link tem algum problema, recarregue a página ou peça outro para o dono do sistema.',
      )
    const muted = HashGenerator.decode(String(contaId.value))[0]
    console.log(muted)
    if (!muted) {
      canSubmit.value = true
      notAcceptId.value = true
      return toast.error('Erro com o ID da conta, verifique com o dono do sistema.')
    }
    const { data } = (await http.get(`/contas/publico/detalhes?id=${muted}`)) as any
    conta.value = data.data
  } catch (error: any) {
    conta.value = null
    console.log(error)
    toast.error(error.response.data.message || 'Erro ao buscar conta.')
  }
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const res = await http.post('/contas/publico/salvarCliente', {
      contaId: HashGenerator.decode(String(contaId.value))[0],
      nome: form.name,
      telefone: form.telefone,
      email: form.email,
      whatsapp: form.whatsapp,
      cep: form.cep,
      cidade: form.cidade,
      estado: form.estado,
      endereco: form.endereco,
      observacao: form.observacao,
    })
    resultOk.value = true
    toast.success(res.data.message)
    cadastroEfetuado.value = true
    yourId.value = res.data.data.id
    reset(false)
  } catch {
    resultOk.value = false
    toast.error('Falha ao enviar. Tente novamente.')
  } finally {
    submitting.value = false
  }
}

function reset(clearMessage = true) {
  Object.keys(form).forEach((k) => (form[k] = ''))
}

onMounted(() => {
  fetchConta()
})
</script>
