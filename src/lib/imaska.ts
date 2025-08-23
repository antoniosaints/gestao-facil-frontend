import { reactive } from 'vue'
import type { MaskInputOptions } from 'maska'

export const moneyMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    // troca ponto por vírgula e remove caracteres inválidos
    return val.replace('.', ',').replace(/[^\d,]/g, '')
  },

  postProcess: (val) => {
    if (!val) return ''

    // garante apenas uma vírgula
    const partes = val.split(',')
    if (partes.length > 2) {
      val = partes[0] + ',' + partes.slice(1).join('')
    }

    // limita 2 casas decimais
    if (partes[1]) {
      partes[1] = partes[1].slice(0, 2)
      val = partes[0] + ',' + partes[1]
    }

    return val
  },
})

export const cpfCnpjMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    // remove tudo que não for número e limita em 14 dígitos
    return val.replace(/[^\d]/g, "").slice(0, 14)
  },

  postProcess: (val) => {
    if (!val) return ""

    // CPF -> 000.000.000-00
    if (val.length <= 11) {
      return val
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d{2})$/, ".$1-$2")
    }

    // CNPJ -> 00.000.000/0000-00
    return val
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  },
})

export const phoneMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    return val.replace(/[^\d]/g, "").slice(0, 11)
  },

  postProcess: (val) => {
    if (!val) return ""

    // Telefone fixo (10 dígitos)
    if (val.length <= 10) {
      return val
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    }

    // Celular (11 dígitos)
    return val
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
  },
})

export const cepMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    return val.replace(/[^\d]/g, "").slice(0, 8)
  },

  postProcess: (val) => {
    if (!val) return ""
    return val.replace(/^(\d{5})(\d)/, "$1-$2")
  },
})

export const ipMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    return val.replace(/[^\d]/g, "").slice(0, 12)
  },

  postProcess: (val) => {
    if (!val) return ""

    return val
      .replace(/(\d{1,3})(\d)/, "$1.$2")
      .replace(/(\d{1,3}\.\d{1,3})(\d)/, "$1.$2")
      .replace(/(\d{1,3}\.\d{1,3}\.\d{1,3})(\d)/, "$1.$2")
  },
})

export const macMaskOptions = reactive<MaskInputOptions>({
  preProcess: (val) => {
    return val.replace(/[^a-fA-F0-9]/g, "").slice(0, 12)
  },

  postProcess: (val) => {
    if (!val) return ""

    return val
      .replace(/(.{2})(?=.)/g, "$1:")
      .replace(/:$/, "") // remove ":" sobrando no final
      .toUpperCase()
  },
})
