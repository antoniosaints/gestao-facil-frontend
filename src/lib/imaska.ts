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
