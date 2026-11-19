<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch, type ComponentPublicInstance } from 'vue'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert } from '@/components/ui/alert'
import {
  Bot,
  Settings,
  SendHorizontal,
  X,
  Package,
  Users,
  ShoppingBag,
  ReceiptText,
  ImagePlus,
  Mic,
  Square,
  AudioLines,
  Paperclip,
  Copy,
  RotateCcw,
  Check,
  ArrowUpRight,
  Trash2,
  Wrench,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useUiStore } from '@/stores/ui/uiStore'
import { useCoreIaWidget } from '@/composables/useCoreIaWidget'
import { useCoreIaChat } from '@/composables/useCoreIaChat'
import { useCoreIaAudio } from '@/composables/useCoreIaAudio'
import { formatCoreIaMessage } from '@/utils/coreIaMarkdown'
import type { CoreIaAction } from '@/repositories/gemini-repository'
import IaUsageIndicator from '@/components/ia/IaUsageIndicator.vue'

const props = defineProps<{ embedded?: boolean; active?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const ui = useUiStore()
const toast = useToast()
const { habilitado } = useCoreIaWidget()
const {
  messages,
  busy,
  phase,
  error,
  draft,
  selectedImage,
  selectedAudio: draftAudio,
  send,
  decide,
  retryLast,
  clear,
  revisionDraft,
} = useCoreIaChat()
const audio = useCoreIaAudio((message) => toast.error(message), draftAudio)
const {
  selected: selectedAudio,
  preparing: preparingAudio,
  recording,
  requesting,
  seconds,
  supported,
} = audio
const preparingImage = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const composer = ref<ComponentPublicInstance | null>(null)
const widgetPreferenceId = `core-chat-widget-${useId()}`
function focusComposer() {
  ;(composer.value?.$el as HTMLTextAreaElement | undefined)?.focus()
}
const imageInput = ref<HTMLInputElement | null>(null)
const audioInput = ref<HTMLInputElement | null>(null)
const usageIndicator = ref<{ refresh: () => void } | null>(null)
const pending = computed(() =>
  messages.value
    .flatMap((message) => message.actions || [])
    .find((action) => action.state !== 'done'),
)
const blocked = computed(
  () =>
    busy.value ||
    recording.value ||
    requesting.value ||
    preparingAudio.value ||
    preparingImage.value ||
    !!pending.value,
)
const canSend = computed(
  () => !blocked.value && Boolean(draft.value.trim() || selectedImage.value || selectedAudio.value),
)
const greeting = computed(() => ui.usuarioLogged?.nome?.split(' ')[0] || '')
const shortcuts = [
  {
    title: 'Registrar venda',
    icon: ShoppingBag,
    text: 'Quero registrar uma venda de ',
    hint: 'Produtos, serviços e quantidades',
  },
  {
    title: 'Lançar receita ou despesa',
    icon: ReceiptText,
    text: 'Quero registrar uma despesa de ',
    hint: 'Valor, descrição e conta financeira',
  },
  {
    title: 'Cadastrar produto',
    icon: Package,
    text: 'Quero cadastrar um produto: ',
    hint: 'Nome, preço e estoque inicial',
  },
  {
    title: 'Cadastrar cliente',
    icon: Users,
    text: 'Quero cadastrar um cliente: ',
    hint: 'Nome e contato, se houver',
  },
  {
    title: 'Cadastrar serviço',
    icon: Wrench,
    text: 'Quero cadastrar um serviço: ',
    hint: 'Nome e preço do serviço',
  },
]
function fill(text: string) {
  if (blocked.value) return
  draft.value = text
  nextTick(focusComposer)
}
async function scroll() {
  await nextTick()
  if (!chatContainer.value) return
  const review =
    pending.value &&
    chatContainer.value.querySelector<HTMLElement>(`[data-action-id="${pending.value.id}"]`)
  if (review)
    chatContainer.value.scrollTop +=
      review.getBoundingClientRect().top - chatContainer.value.getBoundingClientRect().top - 16
  else chatContainer.value.scrollTop = chatContainer.value.scrollHeight
}
watch(() => [messages.value.length, busy.value, error.value], scroll)
onMounted(scroll)
watch(
  () => pending.value?.id,
  async (id) => {
    if (!id) return
    await scroll()
    chatContainer.value
      ?.querySelector<HTMLElement>(`[data-action-id="${id}"] h3`)
      ?.focus({ preventScroll: true })
  },
)
watch(
  () => props.active,
  (active) => {
    if (active) scroll()
    else if (props.embedded) audio.cancel()
  },
)
watch(
  () => `${ui.usuarioLogged?.contaId}:${ui.usuarioLogged?.id}`,
  () => {
    selectedImage.value = null
    audio.cancel()
    audio.remove()
  },
)
async function sendMessage() {
  if (!canSend.value) return
  const text = draft.value.trim()
  const image = selectedImage.value
  const attachment = selectedAudio.value
  draft.value = ''
  selectedImage.value = null
  audio.remove()
  const success = await send(text, image, attachment, image?.dataUrl)
  if (success) usageIndicator.value?.refresh()
  if (!pending.value) nextTick(focusComposer)
}
async function decision(action: CoreIaAction, value: 'confirm' | 'cancel') {
  await decide(action, value)
  usageIndicator.value?.refresh()
}
async function revise(action: CoreIaAction) {
  await decide(action, 'cancel')
  if (action.state === 'done') {
    draft.value = revisionDraft(action)
    nextTick(focusComposer)
  }
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Resposta copiada.')
  } catch {
    toast.error('Não foi possível copiar. Selecione o texto da resposta.')
  }
}
function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}
async function selectImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
    toast.error('Selecione uma imagem de até 10 MB.')
    return
  }
  preparingImage.value = true
  const accountScope = `${ui.usuarioLogged?.contaId}:${ui.usuarioLogged?.id}`
  try {
    const original = await readFile(file)
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Imagem não suportada. Use JPG, PNG ou WebP.'))
      img.src = original
    })
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale)
    canvas.height = Math.round(image.naturalHeight * scale)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a imagem.')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    const data = dataUrl.split(',')[1] || ''
    if (data.length > Math.ceil((4 * 1024 * 1024) / 3) * 4)
      throw new Error('Reduza a imagem para enviar.')
    if (accountScope !== `${ui.usuarioLogged?.contaId}:${ui.usuarioLogged?.id}`) return
    audio.remove()
    selectedImage.value = { dataUrl, data, mimeType: 'image/jpeg', name: file.name }
  } catch (err) {
    toast.error((err as Error).message)
  } finally {
    preparingImage.value = false
  }
}
async function selectAudio(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) {
    selectedImage.value = null
    await audio.select(file)
  }
}
function startRecording() {
  selectedImage.value = null
  audio.remove()
  audio.start()
}
function newChat() {
  if (blocked.value) return
  clear()
  selectedImage.value = null
  audio.remove()
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <Card
    role="region"
    :class="[
      'core-chat flex min-h-0 min-w-0 flex-col overflow-hidden',
      embedded ? 'h-full rounded-none border-0 shadow-none' : 'h-[calc(100dvh-9rem)] min-h-[32rem]',
    ]"
    aria-label="Assistente Core IA"
  >
    <header class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-4 sm:px-6">
      <div class="min-w-0">
        <h1
          class="flex items-center gap-2 font-semibold"
          :class="embedded ? 'text-base' : 'text-xl sm:text-2xl'"
        >
          <Bot class="size-5 shrink-0 text-primary" aria-hidden="true" />CORE IA
        </h1>
        <p class="mt-1 text-sm text-muted-foreground">Assistente de gestão</p>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <IaUsageIndicator v-if="!embedded" ref="usageIndicator" dense />
        <Button
          v-if="messages.length"
          type="button"
          variant="outline"
          size="icon"
          class="h-11 w-11"
          aria-label="Nova conversa"
          title="Nova conversa"
          :disabled="blocked"
          @click="newChat"
          ><Trash2 aria-hidden="true"
        /></Button>
        <Button v-if="embedded" as-child variant="outline" size="icon" class="h-11 w-11"
          ><RouterLink
            to="/chat/ia"
            aria-label="Abrir chat completo"
            title="Abrir chat completo"
            @click="emit('close')"
            ><ArrowUpRight aria-hidden="true" /></RouterLink
        ></Button>
        <Popover v-else>
          <PopoverTrigger as-child
            ><Button
              type="button"
              variant="outline"
              size="icon"
              class="h-11 w-11"
              aria-label="Preferências do chat"
              title="Preferências do chat"
              ><Settings aria-hidden="true" /></Button
          ></PopoverTrigger>
          <PopoverContent align="end" class="w-72">
            <div class="flex items-start justify-between gap-4">
              <Label :for="widgetPreferenceId" class="space-y-1 leading-normal"
                ><span class="block font-medium">Assistente flutuante</span
                ><span class="block text-xs font-normal text-muted-foreground"
                  >Acesse esta conversa em outras telas.</span
                ></Label
              >
              <Switch :id="widgetPreferenceId" v-model="habilitado" />
            </div>
          </PopoverContent>
        </Popover>
        <Button
          v-if="embedded"
          type="button"
          variant="outline"
          size="icon"
          class="h-11 w-11"
          aria-label="Fechar assistente"
          @click="emit('close')"
          ><X aria-hidden="true"
        /></Button>
      </div>
    </header>

    <main
      ref="chatContainer"
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      role="log"
      aria-label="Mensagens da conversa"
      aria-live="polite"
      :aria-busy="busy"
    >
      <div class="mx-auto w-full max-w-4xl p-4 md:p-6">
        <div v-if="!messages.length" class="py-3" :class="embedded ? '' : 'md:py-5'">
          <h2 class="text-lg font-semibold">
            {{ greeting ? `Olá, ${greeting}.` : 'Olá.' }} Como posso ajudar?
          </h2>
          <p class="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Consulte seu negócio ou peça um cadastro por texto, imagem ou áudio. Você revisa os
            dados antes de confirmar.
          </p>
          <div class="mt-6 grid gap-2" :class="embedded ? 'grid-cols-1' : 'sm:grid-cols-2'">
            <Button
              v-for="shortcut in shortcuts"
              :key="shortcut.title"
              type="button"
              variant="outline"
              class="h-auto min-h-16 justify-start gap-3 whitespace-normal p-3 text-left"
              @click="fill(shortcut.text)"
            >
              <component
                :is="shortcut.icon"
                :size="19"
                class="mt-0.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              /><span
                ><span class="block text-sm font-medium">{{ shortcut.title }}</span
                ><span class="mt-1 block text-xs text-muted-foreground">{{
                  shortcut.hint
                }}</span></span
              >
            </Button>
          </div>
          <Button
            type="button"
            variant="link"
            class="mt-3 min-h-11 px-0 text-foreground"
            @click="fill('Como o Core IA pode me ajudar?')"
          >
            Conhecer as possibilidades
          </Button>
        </div>

        <article
          v-for="message in messages"
          :key="message.id"
          class="mb-5 flex min-w-0 flex-col"
          :class="message.isUser ? 'items-end' : 'items-start'"
          :aria-label="message.isUser ? 'Sua mensagem' : 'Resposta do Core IA'"
        >
          <span class="mb-1.5 text-xs font-medium text-muted-foreground">{{
            message.isUser ? 'Você' : 'Core IA'
          }}</span>
          <div
            class="min-w-0 max-w-full rounded-lg px-4 py-3"
            :class="
              message.isUser
                ? 'max-w-[90%] rounded-tr-md bg-primary text-primary-foreground'
                : 'w-full rounded-tl-md border bg-card'
            "
          >
            <img
              v-if="message.imagePreview"
              :src="message.imagePreview"
              alt="Imagem enviada"
              class="mb-3 max-h-48 rounded-lg object-contain"
            />
            <div v-if="message.audioName" class="mb-2 flex items-center gap-2 text-sm">
              <AudioLines :size="18" aria-hidden="true" />{{ message.audioName }}
            </div>
            <div
              class="message-content text-sm leading-relaxed"
              v-html="formatCoreIaMessage(message.text)"
            ></div>
            <details
              v-if="message.transcript"
              open
              class="mt-3 border-t border-current/20 pt-2 text-sm"
            >
              <summary class="min-h-8 cursor-pointer font-medium">Ver transcrição</summary>
              <p class="mt-2 whitespace-pre-wrap leading-relaxed">{{ message.transcript }}</p>
            </details>
            <div
              v-for="action in message.actions"
              :key="action.id"
              class="mt-4 overflow-hidden rounded-lg border bg-card"
              :data-action-id="action.id"
            >
              <div class="border-b bg-muted/40 px-3 py-3">
                <h3 tabindex="-1" class="text-sm font-semibold focus-visible:outline-none">
                  {{ action.title }}
                </h3>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{
                    action.state === 'done'
                      ? 'Revisão encerrada. Veja o resultado na conversa.'
                      : 'Confira antes de gravar. Esta revisão vale por 10 minutos.'
                  }}
                </p>
              </div>
              <dl class="divide-y px-3">
                <div v-for="(field, index) in action.fields" :key="index" class="py-2.5">
                  <dt class="text-xs text-muted-foreground">{{ field.label }}</dt>
                  <dd class="mt-1 whitespace-pre-wrap break-words text-sm font-medium">
                    {{ field.value }}
                  </dd>
                </div>
              </dl>
              <div v-if="action.state !== 'done'" class="flex flex-wrap gap-2 border-t p-3">
                <Button
                  class="min-h-11 text-white"
                  :disabled="busy"
                  @click="decision(action, 'confirm')"
                >
                  <Check :size="17" />Confirmar cadastro
                </Button>
                <Button variant="outline" class="min-h-11" :disabled="busy" @click="revise(action)">
                  Corrigir
                </Button>
                <Button
                  variant="outline"
                  class="min-h-11"
                  :disabled="busy"
                  @click="decision(action, 'cancel')"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
          <div v-if="!message.isUser" class="mt-1 flex w-full items-start justify-between gap-2">
            <details v-if="message.sources?.length" class="min-w-0 text-xs text-muted-foreground">
              <summary class="min-h-9 cursor-pointer py-2">
                Referências do sistema ({{ message.sources.length }})
              </summary>
              <ul class="space-y-2 py-2">
                <li v-for="source in message.sources" :key="source.id">{{ source.title }}</li>
              </ul>
            </details>
            <span v-else />
            <Button
              variant="ghost"
              size="icon"
              class="h-11 w-11 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Copiar resposta"
              title="Copiar resposta"
              @click="copy(message.text)"
            >
              <Copy :size="15" />
            </Button>
          </div>
        </article>
        <div
          v-if="busy"
          class="flex items-center gap-3 py-3 text-sm text-muted-foreground"
          role="status"
        >
          <span
            class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
            aria-hidden="true"
          />{{ phase }}
        </div>
      </div>
    </main>

    <footer
      class="shrink-0 border-t bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-4"
    >
      <div class="mx-auto max-w-4xl space-y-2">
        <Alert v-if="error" variant="destructive" class="text-sm">
          <p>{{ error }}</p>
          <Button
            type="button"
            variant="outline"
            class="mt-2 min-h-11"
            :disabled="busy"
            @click="retryLast"
          >
            <RotateCcw :size="15" />Tentar novamente
          </Button>
        </Alert>
        <p v-if="pending" class="text-xs text-muted-foreground">
          Revise o cadastro acima. Use Corrigir para ajustar os dados ou Cancelar para continuar
          conversando.
        </p>
        <div v-if="selectedImage" class="flex items-center gap-3 rounded-lg border p-2">
          <img
            :src="selectedImage.dataUrl"
            alt="Imagem selecionada"
            class="h-12 w-12 rounded object-cover"
          /><span class="min-w-0 flex-1 truncate text-sm">{{ selectedImage.name }}</span
          ><Button
            variant="ghost"
            size="icon"
            class="h-11 w-11 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Remover imagem"
            @click="selectedImage = null"
          >
            <X :size="18" />
          </Button>
        </div>
        <div v-if="selectedAudio" class="rounded-lg border p-2">
          <div class="flex items-center justify-between gap-2">
            <span class="min-w-0 truncate text-sm">{{ selectedAudio.name }}</span
            ><Button
              variant="ghost"
              size="icon"
              class="h-11 w-11 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Remover áudio"
              @click="audio.remove"
            >
              <X :size="18" />
            </Button>
          </div>
          <audio
            :src="selectedAudio.url"
            controls
            preload="metadata"
            class="h-10 w-full"
            aria-label="Ouvir áudio antes de enviar"
          />
        </div>
        <div
          v-if="recording || requesting"
          class="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2"
          role="status"
        >
          <Mic :size="18" class="text-destructive" aria-hidden="true" /><span
            class="flex-1 text-sm"
            >{{
              requesting
                ? 'Aguardando microfone…'
                : `Gravando ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} / 1:30`
            }}</span
          >
          <Button variant="outline" class="min-h-11" @click="audio.cancel">Descartar</Button
          ><Button v-if="recording" variant="outline" class="min-h-11" @click="audio.stop">
            <Square :size="14" />Concluir
          </Button>
        </div>
        <form class="space-y-2" @submit.prevent="sendMessage">
          <label :for="embedded ? 'core-message-widget' : 'core-message'" class="sr-only"
            >Mensagem para o Core IA</label
          >
          <Textarea
            :id="embedded ? 'core-message-widget' : 'core-message'"
            ref="composer"
            v-model="draft"
            rows="2"
            maxlength="8000"
            aria-label="Mensagem para o Core IA"
            :disabled="blocked"
            placeholder="Descreva o que você precisa…"
            class="max-h-32 min-h-20 resize-y text-base leading-relaxed md:text-sm"
            @keydown="onKeydown"
          />
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-11 w-11 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Anexar imagem"
                aria-label="Anexar imagem"
                :disabled="blocked"
                @click="imageInput?.click()"
              >
                <ImagePlus :size="19" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-11 w-11 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Anexar áudio (até 8 MB)"
                aria-label="Anexar áudio"
                :disabled="blocked"
                @click="audioInput?.click()"
              >
                <Paperclip :size="19" />
              </Button>
              <Button
                v-if="supported"
                type="button"
                variant="ghost"
                size="icon"
                class="h-11 w-11 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
                title="Gravar mensagem de voz"
                aria-label="Gravar mensagem de voz"
                :disabled="blocked"
                @click="startRecording"
              >
                <Mic :size="19" />
              </Button>
              <span v-if="preparingImage || preparingAudio" class="text-xs text-muted-foreground">{{
                preparingAudio ? 'Preparando áudio…' : 'Preparando imagem…'
              }}</span>
            </div>
            <Button
              type="submit"
              class="h-11 min-w-11 text-white"
              aria-label="Enviar mensagem"
              :disabled="!canSend"
            >
              <SendHorizontal :size="18" /><span v-if="!embedded" class="hidden sm:inline"
                >Enviar</span
              >
            </Button>
          </div>
        </form>
        <p class="text-center text-xs leading-relaxed text-muted-foreground">
          {{
            embedded
              ? 'Áudio, imagem ou texto. Você confirma cada cadastro.'
              : 'Enter envia · Shift + Enter quebra a linha. Áudios de até 8 MB; gravações de até 90 segundos.'
          }}
        </p>
        <input
          ref="imageInput"
          type="file"
          accept="image/*"
          class="hidden"
          aria-label="Selecionar imagem"
          @change="selectImage"
        />
        <input
          ref="audioInput"
          type="file"
          accept="audio/*"
          class="hidden"
          aria-label="Selecionar áudio"
          @change="selectAudio"
        />
      </div>
    </footer>
  </Card>
</template>

<style scoped>
.message-content {
  overflow-wrap: anywhere;
}
.message-content :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
}
.message-content :deep(.md-table-wrap) {
  max-width: 100%;
  overflow-x: auto;
  margin: 0.75rem 0;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
}
.message-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
.message-content :deep(th),
.message-content :deep(td) {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid hsl(var(--border));
  white-space: nowrap;
}
.message-content :deep(th) {
  background: hsl(var(--muted));
}
.message-content :deep(li) + :deep(br) {
  display: none;
}
@media (prefers-reduced-motion: reduce) {
  .core-chat *,
  .core-chat *::before {
    animation: none !important;
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
</style>
