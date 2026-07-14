<script setup lang="ts">
import { useStoreToast, type StoreToastVariant } from '@/composables/useStoreToast'
import { CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'

defineProps<{ accent?: string }>()

const { toasts, dismiss } = useStoreToast()
const icons: Record<StoreToastVariant, any> = { success: CheckCircle2, error: XCircle, info: Info }
</script>

<template>
  <Teleport to="body">
    <div class="store-toaster" :style="{ '--shop-primary': accent || '#4f46e5' }">
      <TransitionGroup name="toast" tag="div" class="store-toaster__list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="store-toast"
          :class="`store-toast--${toast.variant}`"
          role="status"
          aria-live="polite"
        >
          <span class="store-toast__icon"><component :is="icons[toast.variant]" class="h-5 w-5" /></span>
          <p class="store-toast__msg">{{ toast.message }}</p>
          <button class="store-toast__close" aria-label="Fechar" @click="dismiss(toast.id)"><X class="h-4 w-4" /></button>
          <span v-if="toast.duration > 0" class="store-toast__bar" :style="{ animationDuration: `${toast.duration}ms` }" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.store-toaster {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 70;
  pointer-events: none;
  width: min(360px, calc(100vw - 2rem));
}
.store-toaster__list { display: flex; flex-direction: column; gap: .625rem; }

.store-toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: .75rem;
  overflow: hidden;
  padding: .875rem 1rem;
  border-radius: .9rem;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 12px 30px -8px rgb(15 23 42 / .25), 0 0 0 1px rgb(15 23 42 / .05);
  pointer-events: auto;
}
.store-toast__icon {
  display: grid;
  place-items: center;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  border-radius: 999px;
  color: #fff;
}
.store-toast__msg { flex: 1; font-size: .9rem; font-weight: 600; line-height: 1.3; }
.store-toast__close {
  flex-shrink: 0;
  border-radius: 999px;
  padding: .25rem;
  color: #94a3b8;
  transition: background .15s, color .15s;
}
.store-toast__close:hover { background: #f1f5f9; color: #0f172a; }

.store-toast__bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  transform-origin: left;
  animation-name: store-toast-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes store-toast-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }

/* Variantes */
.store-toast--success .store-toast__icon { background: #10b981; }
.store-toast--success .store-toast__bar { background: #10b981; }
.store-toast--error .store-toast__icon { background: #ef4444; }
.store-toast--error .store-toast__bar { background: #ef4444; }
.store-toast--info .store-toast__icon { background: var(--shop-primary); }
.store-toast--info .store-toast__bar { background: var(--shop-primary); }

/* Animação de entrada/saída */
.toast-enter-active { transition: transform .35s cubic-bezier(.32, .72, 0, 1), opacity .35s; }
.toast-leave-active { transition: transform .3s ease, opacity .3s; position: absolute; width: 100%; }
.toast-enter-from { transform: translateX(120%); opacity: 0; }
.toast-leave-to { transform: translateX(120%); opacity: 0; }
.toast-move { transition: transform .3s ease; }
</style>
