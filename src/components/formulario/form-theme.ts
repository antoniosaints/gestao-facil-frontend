import { inject, type InjectionKey } from 'vue'

// Portaled controls keep the appearance of the form that opened them.
export const formThemeClassesKey: InjectionKey<string> = Symbol('form-theme-classes')
export function useFormThemeClasses() {
  return inject(formThemeClassesKey, '')
}
