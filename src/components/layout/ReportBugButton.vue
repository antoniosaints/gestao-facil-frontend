<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Bug, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BugRepository, type RelatoBugSeveridade } from '@/repositories/bug-repository'

const route = useRoute()
const toast = useToast()

const open = ref(false)
const saving = ref(false)

const form = ref<{ titulo: string; descricao: string; severidade: RelatoBugSeveridade }>({
  titulo: '',
  descricao: '',
  severidade: 'MEDIA',
})

function resetForm() {
  form.value = { titulo: '', descricao: '', severidade: 'MEDIA' }
}

async function enviar() {
  if (form.value.titulo.trim().length < 3) {
    toast.error('Descreva o problema em poucas palavras.')
    return
  }
  if (form.value.descricao.trim().length < 10) {
    toast.error('Detalhe o que aconteceu (mínimo 10 caracteres).')
    return
  }
  saving.value = true
  try {
    await BugRepository.criar({
      titulo: form.value.titulo.trim(),
      descricao: form.value.descricao.trim(),
      severidade: form.value.severidade,
      rota: route.fullPath,
    })
    toast.success('Relato enviado. Obrigado por ajudar a melhorar o sistema!')
    open.value = false
    resetForm()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Não foi possível enviar o relato.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <button type="button" v-tooltip="'Relatar um problema'"
    class="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    @click="open = true">
    <Bug class="h-5 w-5" />
  </button>

  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Relatar um problema</DialogTitle>
        <DialogDescription>
          Encontrou um bug ou comportamento estranho? Conte para nós e nossa equipe irá analisar.
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4 py-2" @submit.prevent="enviar">
        <div class="grid gap-2">
          <Label for="bug-titulo">Resumo</Label>
          <Input id="bug-titulo" v-model="form.titulo" maxlength="160"
            placeholder="Ex.: Erro ao salvar a venda" required />
        </div>

        <div class="grid gap-2">
          <Label for="bug-severidade">Gravidade</Label>
          <Select v-model="form.severidade">
            <SelectTrigger id="bug-severidade">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BAIXA">Baixa</SelectItem>
              <SelectItem value="MEDIA">Média</SelectItem>
              <SelectItem value="ALTA">Alta</SelectItem>
              <SelectItem value="CRITICA">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-2">
          <Label for="bug-descricao">O que aconteceu?</Label>
          <Textarea id="bug-descricao" v-model="form.descricao" rows="5" maxlength="4000"
            placeholder="Descreva o passo a passo, o que esperava e o que aconteceu." required />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="saving" @click="open = false">Cancelar</Button>
          <Button type="submit" class="font-bold text-white dark:text-white" :disabled="saving">
            <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ saving ? 'Enviando...' : 'Enviar relato' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
