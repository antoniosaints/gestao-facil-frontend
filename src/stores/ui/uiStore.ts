import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('uiStore', () => {
  const openSidebar = ref(true)

  function toggleSidebar() {
    openSidebar.value = !openSidebar.value
  }

  return {
    openSidebar,
    toggleSidebar,
  }
})
