import { inject, type InjectionKey } from 'vue'

export interface ConfirmationOptions {
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
}
export type RequestConfirmation = (options: ConfirmationOptions) => Promise<boolean>
export const confirmationKey: InjectionKey<RequestConfirmation> = Symbol('modo-facil-confirmation')

export function useConfirmation(): RequestConfirmation {
  // Standalone embeds retain a safe confirmation when the shell is absent.
  return inject(confirmationKey, (options) => Promise.resolve(window.confirm(options.description)))
}
