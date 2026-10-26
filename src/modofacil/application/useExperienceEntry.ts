import { onMounted, ref, watch } from 'vue'
import { experience, refreshExperience } from './experience'
export function useExperienceEntry() {
  const entered = ref(experience.configuration?.modo === 'FACIL')
  watch(
    () => experience.sessionVersion,
    () => {
      entered.value = false
    },
    { flush: 'sync' },
  )
  watch(
    () => experience.configuration?.modo,
    (mode) => {
      if (mode === 'FACIL') entered.value = true
    },
  )
  // Also covers hot reload and a shell mounted before session initialization ends.
  onMounted(() => {
    if (!experience.configuration) void refreshExperience()
  })
  return entered
}
