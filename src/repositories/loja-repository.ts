import http from '@/utils/axios'

export type LojaHeaderEstilo = 'padrao' | 'centralizado' | 'banner'

export interface LojaConfig {
  id?: number
  contaId?: number
  corPrimaria: string
  corSecundaria: string
  headerEstilo: LojaHeaderEstilo
  bannerUrl: string | null
  bannerTitulo: string | null
  bannerSubtitulo: string | null
  mensagemBoasVindas: string | null
  mostrarPrecos: boolean
  pedidoWhatsapp: boolean
  permitirLogin: boolean
  permitirCadastro: boolean
}

export type LojaConfigPayload = Partial<
  Pick<
    LojaConfig,
    | 'corPrimaria'
    | 'corSecundaria'
    | 'headerEstilo'
    | 'bannerTitulo'
    | 'bannerSubtitulo'
    | 'mensagemBoasVindas'
    | 'mostrarPrecos'
    | 'pedidoWhatsapp'
    | 'permitirLogin'
    | 'permitirCadastro'
  >
>

export class LojaRepository {
  static async getConfig() {
    const { data } = await http.get('/loja/config')
    return data.data as LojaConfig
  }

  static async saveConfig(payload: LojaConfigPayload) {
    const { data } = await http.put('/loja/config', payload)
    return data.data as LojaConfig
  }

  static async uploadBanner(file: File) {
    const form = new FormData()
    form.append('file', file)
    const { data } = await http.post('/loja/config/banner', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data as { bannerUrl: string; bannerPublicUrl: string }
  }

  static async removeBanner() {
    await http.delete('/loja/config/banner')
  }
}
