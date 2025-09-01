import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('uiStore', () => {
  const openSidebar = ref(true)
  const isMobile = ref(false)

  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      isMobile.value = true
    } else {
      isMobile.value = false
    }
  })

  function toggleSidebar() {
    openSidebar.value = !openSidebar.value
  }

  return {
    openSidebar,
    toggleSidebar,
    isMobile,
  }
})
