import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { InformativoRepository, type InformativoSistema } from '@/repositories/informativo-repository'

export const useInformativosStore = defineStore('informativosStore', () => {
  const items = ref<InformativoSistema[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  const visiveis = computed(() => items.value.filter((item) => !item.dispensado))
  const dispensados = computed(() => items.value.filter((item) => item.dispensado))
  const naoLidos = computed(() => visiveis.value.filter((item) => !item.lido).length)

  async function carregar(force = false) {
    if (loading.value || (loaded.value && !force)) return
    try {
      loading.value = true
      items.value = await InformativoRepository.ativos()
      loaded.value = true
    } catch (error) {
      console.warn('[informativos] Não foi possível carregar o status dos serviços.', error)
    } finally {
      loading.value = false
    }
  }

  async function marcarTodosComoLidos() {
    const pendentes = visiveis.value.filter((item) => !item.lido)
    if (!pendentes.length) return
    pendentes.forEach((item) => { item.lido = true })
    await Promise.allSettled(pendentes.map((item) => InformativoRepository.marcarLido(item.id)))
  }

  async function dispensar(item: InformativoSistema) {
    item.lido = true
    item.dispensado = true
    try {
      await InformativoRepository.dispensar(item.id)
    } catch (error) {
      item.dispensado = false
      console.warn('[informativos] Não foi possível dispensar o informativo.', error)
    }
  }

  return { items, loading, loaded, visiveis, dispensados, naoLidos, carregar, marcarTodosComoLidos, dispensar }
})
