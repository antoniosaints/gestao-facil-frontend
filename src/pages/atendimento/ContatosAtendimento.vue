<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, MessageCircle, Search, Trash2, UserPlus, Users, UserX } from 'lucide-vue-next'
import { WhatsAppRepository, type WhatsAppContactListItem } from '@/repositories/whatsapp-repository'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { useConfirm } from '@/composables/useConfirm'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { useUiStore } from '@/stores/ui/uiStore'

const toast = useToast()
const router = useRouter()
const storeUi = useUiStore()
// Apagar contatos é permitido apenas para administradores (nível 4: admin/root).
const isAdmin = computed(() => Boolean(storeUi.permissoes?.admin))

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const search = ref('')
const contacts = ref<WhatsAppContactListItem[]>([])
const brokenImages = ref<Set<string>>(new Set())

// Estado do modal de edição/vínculo.
const edit = ref<{
  open: boolean
  contact: WhatsAppContactListItem | null
  nome: string
  clienteId: number | null
  clienteNome: string
  customerSearch: string
  customerOptions: Array<{ id: number; label: string }>
}>({ open: false, contact: null, nome: '', clienteId: null, clienteNome: '', customerSearch: '', customerOptions: [] })

function contactLabel(contact: WhatsAppContactListItem) {
  return contact.Cliente?.nome || contact.nome || contact.telefone
}

function initials(value: string) {
  return (
    value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'W'
  )
}

function contactPhoto(contact: WhatsAppContactListItem) {
  if (!contact.foto || brokenImages.value.has(contact.foto)) return null
  return contact.foto
}

function handleImageError(url?: string | null) {
  if (!url) return
  const next = new Set(brokenImages.value)
  next.add(url)
  brokenImages.value = next
}

async function loadContacts() {
  try {
    loading.value = true
    const response = await WhatsAppRepository.listContacts({ search: search.value || undefined, take: 100 })
    contacts.value = response.items
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar os contatos.')
  } finally {
    loading.value = false
  }
}

function openEdit(contact: WhatsAppContactListItem) {
  edit.value = {
    open: true,
    contact,
    nome: contact.nome || '',
    clienteId: contact.clienteId || null,
    clienteNome: contact.Cliente?.nome || '',
    customerSearch: '',
    customerOptions: [],
  }
}

async function loadCustomers() {
  try {
    edit.value.customerOptions = await ClienteRepository.select2(edit.value.customerSearch)
  } catch (error) {
    console.error(error)
    edit.value.customerOptions = []
  }
}

function selectCustomer(value: string) {
  const id = Number(value)
  if (!id) return
  edit.value.clienteId = id
  edit.value.clienteNome = edit.value.customerOptions.find((option) => option.id === id)?.label || ''
}

function unlinkCustomer() {
  edit.value.clienteId = null
  edit.value.clienteNome = ''
}

async function saveEdit() {
  if (!edit.value.contact) return
  try {
    saving.value = true
    const updated = await WhatsAppRepository.updateContact(edit.value.contact.id, {
      nome: edit.value.nome.trim() || null,
      clienteId: edit.value.clienteId,
    })
    const index = contacts.value.findIndex((item) => item.id === updated.id)
    if (index >= 0) contacts.value[index] = updated
    edit.value.open = false
    toast.success('Contato atualizado.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível salvar o contato.')
  } finally {
    saving.value = false
  }
}

async function deleteContact(contact: WhatsAppContactListItem) {
  if (!isAdmin.value) return
  const total = contact._count?.conversas || 0
  const confirmed = await useConfirm().confirm({
    title: 'Apagar contato',
    message: total
      ? `Isso apaga o contato "${contactLabel(contact)}" e ${total} conversa(s) com todas as mensagens, permanentemente. Deseja continuar?`
      : `Isso apaga o contato "${contactLabel(contact)}" permanentemente. Deseja continuar?`,
    confirmText: 'Sim, apagar',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    deletingId.value = contact.id
    await WhatsAppRepository.deleteContact(contact.id)
    contacts.value = contacts.value.filter((item) => item.id !== contact.id)
    toast.success('Contato apagado.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível apagar o contato.')
  } finally {
    deletingId.value = null
  }
}

useSocketEvent<{ id: number }>('whatsapp:contato:deleted', (payload) => {
  if (payload?.id) contacts.value = contacts.value.filter((item) => item.id !== payload.id)
})

// Abre o atendimento já vinculando/iniciando a conversa quando o contato tem cliente.
function openConversation(contact: WhatsAppContactListItem) {
  if (contact.clienteId) {
    router.push({ name: 'atendimento', query: { cliente: contact.clienteId } })
  } else {
    router.push({ name: 'atendimento' })
  }
}

onMounted(loadContacts)
</script>

<template>
  <div class="container mx-auto flex h-[calc(100vh-6rem)] flex-col gap-4 py-4">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Contatos</h1>
          <p class="text-sm text-muted-foreground">
            Todos os contatos do WhatsApp. Vincule-os a clientes do sistema para exibir o nome do cliente nos chats.
          </p>
        </div>
      </div>
      <div class="flex w-full max-w-sm gap-2">
        <Input v-model="search" placeholder="Buscar por nome, telefone ou cliente" @keyup.enter="loadContacts" />
        <Button variant="outline" size="icon" @click="loadContacts"><Search class="h-4 w-4" /></Button>
      </div>
    </header>

    <div class="min-h-0 flex-1 rounded-lg border">
      <ScrollArea class="h-full">
        <div class="divide-y">
          <div
            v-for="contact in contacts"
            :key="contact.id"
            class="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
          >
            <img
              v-if="contactPhoto(contact)"
              :src="contactPhoto(contact) as string"
              :alt="contactLabel(contact)"
              class="h-10 w-10 shrink-0 rounded-full object-cover"
              referrerpolicy="no-referrer"
              @error="handleImageError(contact.foto)"
            />
            <div
              v-else
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {{ initials(contactLabel(contact)) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm font-medium">{{ contactLabel(contact) }}</p>
                <Badge v-if="contact.Cliente" class="h-4 shrink-0 gap-1 bg-green-600 px-1.5 text-[10px] text-white">
                  <UserPlus class="h-3 w-3" /> Cliente
                </Badge>
              </div>
              <p class="truncate text-xs text-muted-foreground">
                {{ contact.telefone }}
                <template v-if="contact.nome && contact.Cliente"> · {{ contact.nome }}</template>
                <template v-if="contact._count?.conversas"> · {{ contact._count.conversas }} conversa(s)</template>
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="icon" title="Abrir no atendimento" @click="openConversation(contact)">
                <MessageCircle class="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" @click="openEdit(contact)">Editar</Button>
              <Button
                v-if="isAdmin"
                variant="ghost"
                size="icon"
                class="text-destructive hover:text-destructive"
                title="Apagar contato"
                :disabled="deletingId === contact.id"
                @click="deleteContact(contact)"
              >
                <LoaderCircle v-if="deletingId === contact.id" class="h-4 w-4 animate-spin" />
                <Trash2 v-else class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div v-if="loading && !contacts.length" class="flex items-center justify-center p-10 text-sm text-muted-foreground">
          <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando contatos...
        </div>
        <div v-else-if="!contacts.length" class="p-10 text-center text-sm text-muted-foreground">
          Nenhum contato encontrado.
        </div>
      </ScrollArea>
    </div>

    <!-- Modal editar/vincular contato -->
    <Dialog v-model:open="edit.open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar contato</DialogTitle>
          <DialogDescription>
            Renomeie o contato e vincule-o a um cliente do sistema. Se vinculado, o chat mostra o nome do cliente.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="space-y-1">
            <Label>Nome do contato</Label>
            <Input v-model="edit.nome" placeholder="Nome exibido quando não há cliente vinculado" />
          </div>

          <div class="space-y-1">
            <Label>Cliente vinculado</Label>
            <p v-if="edit.clienteId" class="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span class="flex items-center gap-1 text-green-600">
                <UserPlus class="h-3.5 w-3.5" /> {{ edit.clienteNome || 'Cliente vinculado' }}
              </span>
              <Button variant="ghost" size="sm" class="h-7 text-destructive hover:text-destructive" @click="unlinkCustomer">
                <UserX class="mr-1 h-3.5 w-3.5" /> Desvincular
              </Button>
            </p>
            <div class="flex gap-2">
              <Input v-model="edit.customerSearch" placeholder="Buscar cliente" @keyup.enter="loadCustomers" />
              <Button variant="outline" size="icon" @click="loadCustomers"><Search class="h-4 w-4" /></Button>
            </div>
            <select
              v-if="edit.customerOptions.length"
              class="h-9 w-full rounded-md border bg-background px-3 text-sm"
              @change="selectCustomer(($event.target as HTMLSelectElement).value)"
            >
              <option value="">Selecionar cliente...</option>
              <option v-for="customer in edit.customerOptions" :key="customer.id" :value="customer.id">{{ customer.label }}</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="edit.open = false">Cancelar</Button>
          <Button class="text-white" :disabled="saving" @click="saveEdit">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
