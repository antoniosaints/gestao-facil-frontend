<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const composer = ref<HTMLTextAreaElement | null>(null)
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
  nextTick(() => composer.value?.focus())
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
  if (!pending.value) nextTick(() => composer.value?.focus())
}
async function decision(action: CoreIaAction, value: 'confirm' | 'cancel') {
  await decide(action, value)
  usageIndicator.value?.refresh()
}
async function revise(action: CoreIaAction) {
  await decide(action, 'cancel')
  if (action.state === 'done') {
    draft.value = revisionDraft(action)
    nextTick(() => composer.value?.focus())
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
  <section
    :class="[
      'core-chat flex min-h-0 flex-col overflow-hidden bg-background text-foreground',
      embedded ? 'h-full' : 'h-[calc(100dvh-6rem)] -m-4 md:h-[calc(100dvh-5.3rem)]',
    ]"
    aria-label="Assistente Core IA"
  >
    <header class="flex shrink-0 items-center justify-between gap-2 border-b bg-card px-4 py-3">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-foreground"
        >
          <Bot :size="22" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <h1 class="whitespace-nowrap font-semibold">Core IA</h1>
          <p class="truncate text-xs text-muted-foreground">Seu negócio em uma conversa</p>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <IaUsageIndicator v-if="!embedded" ref="usageIndicator" dense />
        <button
          v-if="messages.length"
          class="icon-btn"
          aria-label="Nova conversa"
          title="Nova conversa"
          :disabled="blocked"
          @click="newChat"
        >
          <Trash2 :size="18" />
        </button>
        <RouterLink
          v-if="embedded"
          to="/chat/ia"
          class="icon-btn"
          aria-label="Abrir chat completo"
          title="Abrir chat completo"
          @click="emit('close')"
          ><ArrowUpRight :size="19"
        /></RouterLink>
        <details v-else class="relative">
          <summary class="icon-btn list-none cursor-pointer" aria-label="Preferências do chat">
            <Settings :size="19" />
          </summary>
          <div
            class="absolute right-0 z-20 mt-2 w-64 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg"
          >
            <label class="flex cursor-pointer items-start gap-3 text-sm"
              ><input
                v-model="habilitado"
                type="checkbox"
                class="mt-1 h-4 w-4 accent-primary"
              /><span
                >Assistente flutuante<span class="mt-1 block text-xs text-muted-foreground"
                  >Acesse esta conversa em outras telas.</span
                ></span
              ></label
            >
          </div>
        </details>
        <button
          v-if="embedded"
          class="icon-btn"
          aria-label="Fechar assistente"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
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
      <div class="mx-auto w-full max-w-3xl p-4 md:p-6">
        <div v-if="!messages.length" class="py-5" :class="embedded ? '' : 'md:py-12'">
          <h2 class="text-xl font-semibold tracking-tight md:text-2xl">
            {{ greeting ? `Olá, ${greeting}.` : 'Olá.' }} O que vamos organizar?
          </h2>
          <p class="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Consulte seu negócio ou peça um cadastro por texto, imagem ou áudio. Você revisa os
            dados antes de confirmar.
          </p>
          <div class="mt-6 grid gap-2" :class="embedded ? 'grid-cols-1' : 'sm:grid-cols-2'">
            <button
              v-for="shortcut in shortcuts"
              :key="shortcut.title"
              class="flex items-start gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            </button>
          </div>
          <button
            class="mt-4 min-h-11 text-sm text-foreground underline underline-offset-4 hover:underline"
            @click="fill('Como o Core IA pode me ajudar?')"
          >
            Conhecer as possibilidades
          </button>
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
            class="min-w-0 max-w-full rounded-2xl px-4 py-3"
            :class="
              message.isUser
                ? 'max-w-[90%] rounded-tr-sm bg-primary text-primary-foreground'
                : 'w-full rounded-tl-sm border bg-card'
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
              class="mt-4 overflow-hidden rounded-xl border border-primary/30 bg-background"
              :data-action-id="action.id"
            >
              <div class="border-b bg-primary/5 px-3 py-3">
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
                <button
                  class="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  :disabled="busy"
                  @click="decision(action, 'confirm')"
                >
                  <Check :size="17" />Confirmar cadastro
                </button>
                <button class="secondary-btn" :disabled="busy" @click="revise(action)">
                  Corrigir
                </button>
                <button class="secondary-btn" :disabled="busy" @click="decision(action, 'cancel')">
                  Cancelar
                </button>
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
            <button
              class="icon-btn"
              aria-label="Copiar resposta"
              title="Copiar resposta"
              @click="copy(message.text)"
            >
              <Copy :size="15" />
            </button>
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
      <div class="mx-auto max-w-3xl space-y-2">
        <div
          v-if="error"
          class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
          role="alert"
        >
          <p>{{ error }}</p>
          <button
            class="mt-2 inline-flex min-h-9 items-center gap-2 font-medium underline"
            :disabled="busy"
            @click="retryLast"
          >
            <RotateCcw :size="15" />Tentar novamente
          </button>
        </div>
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
          ><button class="icon-btn" aria-label="Remover imagem" @click="selectedImage = null">
            <X :size="18" />
          </button>
        </div>
        <div v-if="selectedAudio" class="rounded-lg border p-2">
          <div class="flex items-center justify-between gap-2">
            <span class="min-w-0 truncate text-sm">{{ selectedAudio.name }}</span
            ><button class="icon-btn" aria-label="Remover áudio" @click="audio.remove">
              <X :size="18" />
            </button>
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
          class="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-2"
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
          <button class="secondary-btn" @click="audio.cancel">Descartar</button
          ><button v-if="recording" class="secondary-btn" @click="audio.stop">
            <Square :size="14" />Concluir
          </button>
        </div>
        <form
          class="rounded-xl border bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15"
          @submit.prevent="sendMessage"
        >
          <label :for="embedded ? 'core-message-widget' : 'core-message'" class="sr-only"
            >Mensagem para o Core IA</label
          >
          <textarea
            :id="embedded ? 'core-message-widget' : 'core-message'"
            ref="composer"
            v-model="draft"
            rows="2"
            maxlength="8000"
            aria-label="Mensagem para o Core IA"
            :disabled="blocked"
            placeholder="Descreva o que você precisa…"
            class="block max-h-32 min-h-16 w-full resize-y rounded-t-xl bg-transparent px-3 pt-3 text-base leading-relaxed outline-none disabled:opacity-60 md:text-sm"
            @keydown="onKeydown"
          />
          <div class="flex items-center justify-between gap-1 p-1.5">
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="icon-btn"
                title="Anexar imagem"
                aria-label="Anexar imagem"
                :disabled="blocked"
                @click="imageInput?.click()"
              >
                <ImagePlus :size="19" />
              </button>
              <button
                type="button"
                class="icon-btn"
                title="Anexar áudio (até 8 MB)"
                aria-label="Anexar áudio"
                :disabled="blocked"
                @click="audioInput?.click()"
              >
                <Paperclip :size="19" />
              </button>
              <button
                v-if="supported"
                type="button"
                class="icon-btn"
                title="Gravar mensagem de voz"
                aria-label="Gravar mensagem de voz"
                :disabled="blocked"
                @click="startRecording"
              >
                <Mic :size="19" />
              </button>
              <span v-if="preparingImage || preparingAudio" class="text-xs text-muted-foreground">{{
                preparingAudio ? 'Preparando áudio…' : 'Preparando imagem…'
              }}</span>
            </div>
            <button
              type="submit"
              class="flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              aria-label="Enviar mensagem"
              :disabled="!canSend"
            >
              <SendHorizontal :size="18" /><span v-if="!embedded" class="hidden sm:inline"
                >Enviar</span
              >
            </button>
          </div>
        </form>
        <p class="text-center text-[11px] leading-relaxed text-muted-foreground">
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
  </section>
</template>

<style scoped>
.icon-btn {
  @apply inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40;
}
.secondary-btn {
  @apply inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40;
}
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
