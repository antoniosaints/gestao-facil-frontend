import { computed, inject, type InjectionKey, type Ref } from 'vue'

export const modalLayerKey: InjectionKey<Ref<number>> = Symbol('modal-layer')

const BASE_MODAL_LAYER = 60
const MODAL_LAYER_STEP = 10

let modalLayerSeed = BASE_MODAL_LAYER

export function allocateModalLayer(parentLayer?: number | null) {
  const minimumLayer = (parentLayer ?? BASE_MODAL_LAYER - MODAL_LAYER_STEP) + MODAL_LAYER_STEP
  modalLayerSeed = Math.max(modalLayerSeed + MODAL_LAYER_STEP, minimumLayer)

  return modalLayerSeed
}

export function usePortalLayer(offset: number, fallback = 50) {
  const currentLayer = inject(modalLayerKey, null)

  return computed(() => {
    return (currentLayer?.value ?? fallback) + offset
  })
}
