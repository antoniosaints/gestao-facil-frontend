import type { FunctionDirective, ObjectDirective } from 'vue'
import type { MaskInputOptions } from 'maska'
import { vMaska as upstreamMaska } from 'maska/vue'
import { decimalMaskPrecision } from './imaska'

type Value = MaskInputOptions | string | undefined
type DecimalState = { precision: number; lastValue: string; dispose: () => void }
const decimals = new WeakMap<HTMLInputElement, DecimalState>()
const delegate = upstreamMaska as FunctionDirective<HTMLElement, Value>

function clean(value: string, precision: number, commit: boolean, fromModel = false) {
  let result = value.replace(/[^\d.,]/g, '')
  // Keep a typed dot until the comma arrives. Converting it immediately loses
  // digits when users type grouped BR values such as 1.234,56 character by character.
  if (result.includes(',')) {
    const [integer, ...fraction] = result.replace(/\./g, '').split(',')
    return integer + ',' + fraction.join('').slice(0, precision)
  }
  if (!commit || !result.includes('.')) return result
  const grouped = !fromModel && precision === 2 && /^[1-9]\d{0,2}(\.\d{3})+$/.test(result)
  if (grouped) return result.replace(/\./g, '')
  const [integer, ...fraction] = result.split('.')
  result = integer + ',' + fraction.join('').slice(0, precision)
  return result
}
function setupDecimal(input: HTMLInputElement, precision: number) {
  let emitting = false
  const state: DecimalState = { precision, lastValue: input.value, dispose: () => {} }
  const write = (value: string, emit: boolean) => {
    state.lastValue = value
    if (input.value === value) return
    const cursor = input.selectionStart
    const oldLength = input.value.length
    input.value = value
    if (document.activeElement === input && cursor !== null) {
      const position = Math.max(0, cursor + value.length - oldLength)
      input.setSelectionRange(position, position)
    }
    if (emit) {
      emitting = true
      try {
        input.dispatchEvent(new Event('input', { bubbles: true }))
      } finally {
        emitting = false
      }
    }
  }
  const onInput = () => {
    if (!emitting) write(clean(input.value, state.precision, false), false)
  }
  const commit = () => write(clean(input.value, state.precision, true), true)
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter') commit()
  }
  input.addEventListener('input', onInput, true)
  input.addEventListener('blur', commit)
  input.addEventListener('keydown', onKey, true)
  state.dispose = () => {
    input.removeEventListener('input', onInput, true)
    input.removeEventListener('blur', commit)
    input.removeEventListener('keydown', onKey, true)
  }
  decimals.set(input, state)
  // Backend decimals use a dot; normalize once without guessing a thousands group.
  queueMicrotask(() => write(clean(input.value, state.precision, true, true), true))
}
function inputOf(element: HTMLElement) {
  return element instanceof HTMLInputElement ? element : element.querySelector('input')
}
const apply: FunctionDirective<HTMLElement, Value> = (element, binding, vnode, previous) => {
  const precision = decimalMaskPrecision(binding.value)
  const input = inputOf(element)
  if (precision === undefined || !input) {
    delegate(element, binding, vnode, previous)
    return
  }
  const state = decimals.get(input)
  if (!state) setupDecimal(input, precision)
  else {
    state.precision = precision
    // Vue's own v-model updates are already normalized by the input listener.
    if (input.value !== state.lastValue) {
      state.dispose()
      decimals.delete(input)
      setupDecimal(input, precision)
    }
  }
}

/** Existing Maska behavior for documents/phones; decimal editing preserves grouping intent. */
export const vMaska: ObjectDirective<HTMLElement, Value> = {
  mounted: apply,
  updated: apply,
  unmounted(element) {
    const input = inputOf(element)
    if (input) {
      decimals.get(input)?.dispose()
      decimals.delete(input)
    }
  },
}
