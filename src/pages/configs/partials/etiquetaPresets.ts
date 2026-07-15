// Tipos e presets dos modelos de impressão de etiquetas de produtos.
// Todas as medidas em milímetros (exceto fontes, em pt). O mesmo formato é validado
// no backend (schemas/contas.ts) e consumido por labelSheetService.ts.

export type PapelEtiqueta = 'A4' | 'A5' | 'Letter' | 'CUSTOM'
export type SimbologiaEtiqueta = 'code128' | 'ean13'

export interface EtiquetaModelo {
  id: string
  nome: string
  papel: PapelEtiqueta
  larguraPapelMm?: number | null
  alturaPapelMm?: number | null
  margemTopoMm: number
  margemEsquerdaMm: number
  colunas: number
  linhas: number
  larguraEtiquetaMm: number
  alturaEtiquetaMm: number
  espacamentoHorizontalMm: number
  espacamentoVerticalMm: number
  paddingMm: number
  mostrarNome: boolean
  mostrarPreco: boolean
  mostrarCodigoTexto: boolean
  mostrarBorda: boolean
  fonteNomePt: number
  fontePrecoPt: number
  simbologia: SimbologiaEtiqueta
}

// Dimensões nominais das folhas (mm) para o preview.
export const DIMENSOES_PAPEL: Record<Exclude<PapelEtiqueta, 'CUSTOM'>, { largura: number; altura: number }> = {
  A4: { largura: 210, altura: 297 },
  A5: { largura: 148, altura: 210 },
  Letter: { largura: 215.9, altura: 279.4 },
}

export function dimensoesPapel(modelo: Pick<EtiquetaModelo, 'papel' | 'larguraPapelMm' | 'alturaPapelMm'>) {
  if (modelo.papel === 'CUSTOM') {
    return {
      largura: modelo.larguraPapelMm || 210,
      altura: modelo.alturaPapelMm || 297,
    }
  }
  return DIMENSOES_PAPEL[modelo.papel]
}

// Modelo em branco (base para criação manual).
export function modeloEmBranco(): Omit<EtiquetaModelo, 'id'> {
  return {
    nome: '',
    papel: 'A4',
    larguraPapelMm: null,
    alturaPapelMm: null,
    margemTopoMm: 10,
    margemEsquerdaMm: 5,
    colunas: 3,
    linhas: 8,
    larguraEtiquetaMm: 63.5,
    alturaEtiquetaMm: 33.9,
    espacamentoHorizontalMm: 2.5,
    espacamentoVerticalMm: 0,
    paddingMm: 1.5,
    mostrarNome: true,
    mostrarPreco: true,
    mostrarCodigoTexto: true,
    mostrarBorda: false,
    fonteNomePt: 7,
    fontePrecoPt: 8,
    simbologia: 'code128',
  }
}

// Presets prontos: o cliente parte de um e ajusta os números exatos do papel que comprou.
export interface EtiquetaPreset {
  chave: string
  descricao: string
  modelo: Omit<EtiquetaModelo, 'id'>
}

export const ETIQUETA_PRESETS: EtiquetaPreset[] = [
  {
    chave: 'a4-65',
    descricao: 'A4 · 65 etiquetas (5×13) · 38,1×21,2mm — Pimaco 6180',
    modelo: {
      nome: 'A4 - 65 etiquetas (Pimaco 6180)',
      papel: 'A4',
      larguraPapelMm: null,
      alturaPapelMm: null,
      margemTopoMm: 10.7,
      margemEsquerdaMm: 4.7,
      colunas: 5,
      linhas: 13,
      larguraEtiquetaMm: 38.1,
      alturaEtiquetaMm: 21.2,
      espacamentoHorizontalMm: 2.5,
      espacamentoVerticalMm: 0,
      paddingMm: 1,
      mostrarNome: false,
      mostrarPreco: false,
      mostrarCodigoTexto: true,
      mostrarBorda: false,
      fonteNomePt: 5,
      fontePrecoPt: 6,
      simbologia: 'code128',
    },
  },
  {
    chave: 'a4-24',
    descricao: 'A4 · 24 etiquetas (3×8) · 63,5×33,9mm',
    modelo: {
      nome: 'A4 - 24 etiquetas (3×8)',
      papel: 'A4',
      larguraPapelMm: null,
      alturaPapelMm: null,
      margemTopoMm: 12.9,
      margemEsquerdaMm: 7.2,
      colunas: 3,
      linhas: 8,
      larguraEtiquetaMm: 63.5,
      alturaEtiquetaMm: 33.9,
      espacamentoHorizontalMm: 2.5,
      espacamentoVerticalMm: 0,
      paddingMm: 1.5,
      mostrarNome: true,
      mostrarPreco: true,
      mostrarCodigoTexto: true,
      mostrarBorda: false,
      fonteNomePt: 7,
      fontePrecoPt: 8,
      simbologia: 'code128',
    },
  },
  {
    chave: 'a4-14',
    descricao: 'A4 · 14 etiquetas (2×7) · 99,1×38,1mm',
    modelo: {
      nome: 'A4 - 14 etiquetas (2×7)',
      papel: 'A4',
      larguraPapelMm: null,
      alturaPapelMm: null,
      margemTopoMm: 15.1,
      margemEsquerdaMm: 4.7,
      colunas: 2,
      linhas: 7,
      larguraEtiquetaMm: 99.1,
      alturaEtiquetaMm: 38.1,
      espacamentoHorizontalMm: 2.5,
      espacamentoVerticalMm: 0,
      paddingMm: 2,
      mostrarNome: true,
      mostrarPreco: true,
      mostrarCodigoTexto: true,
      mostrarBorda: false,
      fonteNomePt: 8,
      fontePrecoPt: 9,
      simbologia: 'code128',
    },
  },
  {
    chave: 'a4-10',
    descricao: 'A4 · 10 etiquetas (2×5) · 99,1×57,0mm',
    modelo: {
      nome: 'A4 - 10 etiquetas (2×5)',
      papel: 'A4',
      larguraPapelMm: null,
      alturaPapelMm: null,
      margemTopoMm: 12.9,
      margemEsquerdaMm: 4.7,
      colunas: 2,
      linhas: 5,
      larguraEtiquetaMm: 99.1,
      alturaEtiquetaMm: 57,
      espacamentoHorizontalMm: 2.5,
      espacamentoVerticalMm: 0,
      paddingMm: 2,
      mostrarNome: true,
      mostrarPreco: true,
      mostrarCodigoTexto: true,
      mostrarBorda: false,
      fonteNomePt: 9,
      fontePrecoPt: 10,
      simbologia: 'code128',
    },
  },
  {
    chave: 'a4-continuo',
    descricao: 'A4 · 3 colunas contínuo (compatível com o layout antigo)',
    modelo: {
      nome: 'A4 - 3 colunas contínuo',
      papel: 'A4',
      larguraPapelMm: null,
      alturaPapelMm: null,
      margemTopoMm: 10.6,
      margemEsquerdaMm: 10.6,
      colunas: 3,
      linhas: 11,
      larguraEtiquetaMm: 60,
      alturaEtiquetaMm: 24,
      espacamentoHorizontalMm: 3.5,
      espacamentoVerticalMm: 1,
      paddingMm: 1.5,
      mostrarNome: true,
      mostrarPreco: true,
      mostrarCodigoTexto: true,
      mostrarBorda: true,
      fonteNomePt: 6.5,
      fontePrecoPt: 8,
      simbologia: 'code128',
    },
  },
]
