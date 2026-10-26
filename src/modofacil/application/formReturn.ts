import { inject, type ComputedRef, type InjectionKey } from 'vue'
import { useRouter } from 'vue-router'
export const formReturnKey: InjectionKey<ComputedRef<string>> = Symbol('modo-facil-form-return')
/** Retain filters/page when a form links back to the page it was opened from. */
export function useFormDestination() {
  const origin = inject(formReturnKey, undefined)
  const router = useRouter()
  return (fallback: string) =>
    origin?.value && router.resolve(origin.value).path === fallback ? origin.value : fallback
}
