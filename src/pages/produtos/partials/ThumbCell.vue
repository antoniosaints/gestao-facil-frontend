<script setup lang="ts">
import { ref } from 'vue'
import { resolveFileUrl } from '@/utils/fileUrl'
import { ImageOff, X } from 'lucide-vue-next'

const props = defineProps<{
  image?: string | null
  alt?: string
}>()

// Lightbox local ao clicar na miniatura (teleportado para o body, igual aos detalhes do produto).
const preview = ref('')
function abrir() {
  if (props.image) preview.value = resolveFileUrl(props.image)
}
</script>

<template>
  <div>
    <img
      v-if="image"
      :src="resolveFileUrl(image)"
      :alt="alt || 'Imagem do produto'"
      class="h-9 w-9 shrink-0 cursor-zoom-in rounded-md border border-border object-cover"
      @click.stop="abrir"
    />
    <div v-else class="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-dashed border-border text-muted-foreground/60">
      <ImageOff class="h-4 w-4" />
    </div>

    <Teleport to="body">
      <div
        v-if="preview"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
        @click="preview = ''"
      >
        <img :src="preview" :alt="alt || 'Imagem do produto'" class="max-h-[95vh] max-w-[95vw] rounded-lg object-contain shadow-2xl" @click.stop />
        <button type="button" class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" @click="preview = ''">
          <X class="h-5 w-5" />
        </button>
      </div>
    </Teleport>
  </div>
</template>
