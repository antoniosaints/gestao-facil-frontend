import type { InjectionKey } from 'vue'
import type { useDomainMutation } from './useDomainMutation'
// The table renders desktop and mobile slots. Both views share the result of
// a deletion, including an uncertain response, for this mounted list only.
export const deletionScopeKey: InjectionKey<Map<string, ReturnType<typeof useDomainMutation>>> =
  Symbol('modo-facil-deletions')
