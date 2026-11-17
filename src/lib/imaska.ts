import { reactive, toRaw } from 'vue'
import type { MaskInputOptions } from 'maska'

const decimalPrecisions = new WeakMap<object, number>()
export function decimalMaskPrecision(value: unknown) {
  return value && typeof value === 'object' ? decimalPrecisions.get(toRaw(value)) : undefined
}

export function createDecimalMaskOptions(decimalPlaces = 2) {
  const options = reactive<MaskInputOptions>({
    preProcess: (val) => {
      // troca ponto por vírgula e remove caracteres inválidos
      const normalized = val.replace(/[^\d.,]/g, '')
      if (normalized.includes(',') && normalized.includes('.')) {
        return normalized.replace(/\./g, '')
      }
      return normalized.replace(/\./g, ',')
    },

    postProcess: (val) => {
      if (!val) return ''

      // garante apenas uma vírgula
      const partes = val.split(',')
      if (partes.length > 2) {
        val = partes[0] + ',' + partes.slice(1).join('')
      }

      // limita as casas sem reduzir a precisão dos custos técnicos.
      if (partes[1]) {
        partes[1] = partes[1].slice(0, decimalPlaces)
        val = partes[0] + ',' + partes[1]
      }

      return val
    },
  })
  decimalPrecisions.set(toRaw(options), decimalPlaces)
  return options
}

export const moneyMaskOptions = createDecimalMaskOptions(2)
export const preciseMoneyMaskOptions = createDecimalMaskOptions(6)

export const cpfCnpjMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    // remove tudo que não for número e limita em 14 dígitos
    return val.replace(/[^\d]/g, '').slice(0, 14)
  },

  postProcess: (val) => {
    if (!val) return ''

    // CPF -> 000.000.000-00
    if (val.length <= 11) {
      const groups = [val.slice(0, 3), val.slice(3, 6), val.slice(6, 9), val.slice(9)]
      return groups.reduce(
        (result, group, index) => result + (group ? ['', '.', '.', '-'][index] + group : ''),
        '',
      )
    }

    // CNPJ -> 00.000.000/0000-00
    return val
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  },
})

export const phoneMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 15)
    return val.trimStart().startsWith('+') ? `+${digits}` : digits
  },

  postProcess: (val) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) return val.startsWith('+') ? '+' : ''
    const international = val.startsWith('+') || digits.length > 11
    // Preserve foreign country codes and the full international number.
    if (international && (!digits.startsWith('55') || digits.length > 13)) return `+${digits}`
    const local = international ? digits.slice(2) : digits
    const formatted = local
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(local.length > 10 ? /(\d{5})(\d{1,4})$/ : /(\d{4})(\d{1,4})$/, '$1-$2')
    return international ? `+${digits.slice(0, 2)}${local ? ` ${formatted}` : ''}` : formatted
  },
})

/** Company identity displayed in the storefront also accepts alphanumeric CNPJ. */
export const cnpjMaskOptions = reactive<MaskInputOptions>({
  preProcess: (value) =>
    value
      .replace(/[^a-z\d]/gi, '')
      .toUpperCase()
      .slice(0, 14),
  postProcess: (value) => {
    const groups = [
      value.slice(0, 2),
      value.slice(2, 5),
      value.slice(5, 8),
      value.slice(8, 12),
      value.slice(12),
    ]
    return groups.reduce(
      (result, group, index) => result + (group ? ['', '.', '.', '/', '-'][index] + group : ''),
      '',
    )
  },
})

export const cepMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    return val.replace(/[^\d]/g, '').slice(0, 8)
  },

  postProcess: (val) => {
    if (!val) return ''
    return val.replace(/^(\d{5})(\d)/, '$1-$2')
  },
})

export const ipMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    return val.replace(/[^\d]/g, '').slice(0, 12)
  },

  postProcess: (val) => {
    if (!val) return ''

    return val
      .replace(/(\d{1,3})(\d)/, '$1.$2')
      .replace(/(\d{1,3}\.\d{1,3})(\d)/, '$1.$2')
      .replace(/(\d{1,3}\.\d{1,3}\.\d{1,3})(\d)/, '$1.$2')
  },
})

export const macMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    return val.replace(/[^a-fA-F0-9]/g, '').slice(0, 12)
  },

  postProcess: (val) => {
    if (!val) return ''

    return val
      .replace(/(.{2})(?=.)/g, '$1:')
      .replace(/:$/, '') // remove ":" sobrando no final
      .toUpperCase()
  },
})
