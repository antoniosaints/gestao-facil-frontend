import { reactive } from 'vue'
import { configurationApi, type Configuration } from '../adapters/configuration'
import { errorMessage } from './format'
export const experience = reactive({
  configuration: null as Configuration | null,
  error: '',
  loading: false,
  dirty: false,
  changed: false,
  completeModule: null as string | null,
  sessionVersion: 0,
})
let identity = ''
let request: Promise<void> | null = null
export async function refreshExperience() {
  const current = localStorage.getItem('gestao_facil:token') || ''
  if (current !== identity) {
    identity = current
    experience.sessionVersion++
    experience.configuration = null
    experience.error = ''
    experience.loading = false
    experience.changed = false
    experience.completeModule = null
    experience.dirty = false
    request = null
  }
  if (!current) return
  if (request) return request
  experience.loading = true
  const owner = experience.sessionVersion
  request = (async () => {
    try {
      const config = await configurationApi.get()
      if (experience.sessionVersion !== owner) return
      experience.changed =
        !!experience.configuration && experience.configuration.modo !== config.modo
      experience.configuration = config
      experience.error = ''
    } catch (e) {
      if (experience.sessionVersion === owner) experience.error = errorMessage(e)
    } finally {
      if (experience.sessionVersion === owner) {
        experience.loading = false
        request = null
      }
    }
  })()
  return request
}
