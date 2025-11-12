import qz from 'qz-tray'
import { ImpressaoRepository } from '@/repositories/impressao-repository'

type PaperSize = 'A4' | 'A5' | 'Letter' | 'cupom'

const sizeMap: Record<PaperSize, { width: number; height: number }> = {
  A4: { width: 8.27, height: 11.69 },
  A5: { width: 5.83, height: 8.27 },
  Letter: { width: 8.5, height: 11 },
  cupom: { width: 3.15, height: 11.69 },
}

const typeMap = {
  pdfBase64: { type: 'pdf', format: 'base64', flavor: undefined },
  pdfFile: { type: 'pdf', format: 'file', flavor: undefined },
  html: { type: 'pixel', format: 'html', flavor: 'plain' },
  raw: { type: 'raw', format: 'plain', flavor: 'plain' },
  image: { type: 'image', format: 'base64', flavor: 'plain' },
} as const

interface Printer {
  content: string
  arquivo: keyof typeof typeMap
}

class QZService {
  private async ensureConnection() {
    if (!qz.websocket.isActive()) {
      await qz.security.setCertificatePromise(
        async () => await ImpressaoRepository.getCertificado(),
      )
      qz.security.setSignatureAlgorithm('SHA512')
      await qz.security.setSignaturePromise(
        async (toSign: string) => await ImpressaoRepository.getSignature(toSign),
      )
      await qz.websocket.connect()
    }
  }
  isConnected() {
    return qz.websocket.isActive()
  }

  async connect() {
    await this.ensureConnection()
  }

  async disconnect() {
    if (this.isConnected()) await qz.websocket.disconnect()
  }

  async getPrinters() {
    await this.ensureConnection()
    return qz.printers.find()
  }

  savePrinter(printer: string) {
    localStorage.setItem('qz_printer', printer)
  }

  getSavedPrinter(): string {
    const p = localStorage.getItem('qz_printer')
    if (!p) throw new Error('Nenhuma impressora salva.')
    return p
  }

  getSavedSize(): PaperSize {
    return (localStorage.getItem('qz_size_paper') as PaperSize) ?? 'A4'
  }

  private getConfig(extra: object = {}) {
    const paper = this.getSavedSize()
    const size = sizeMap[paper] ?? sizeMap.A4

    return qz.configs.create(this.getSavedPrinter(), {
      copies: 1,
      size,
      units: 'in',
      jobName: 'Impressao - Gestao Facil',
      ...extra,
    })
  }

  async print({ content, arquivo }: Printer) {
    await this.ensureConnection()

    const mapper = typeMap[arquivo]
    const config = this.getConfig()
    const payload = [{ ...mapper, data: content }]

    return qz.print(config, payload)
  }

  async printTermal(content: string) {
    await this.ensureConnection()

    const config = qz.configs.create(this.getSavedPrinter(), {
      size: sizeMap.cupom,
      units: 'in',
    })

    return qz.print(config, [{ type: 'raw', format: 'plain', data: content }])
  }

  async printNormal(html: string) {
    await this.ensureConnection()
    return qz.print(this.getConfig(), [
      { type: 'pixel', format: 'html', flavor: 'plain', data: html },
    ])
  }

  async printPDF(blob: Blob) {
    await this.ensureConnection()

    const base64 = await blobToBase64(blob)
    return qz.print(this.getConfig(), [{ type: 'pdf', format: 'base64', data: base64 as string }])
  }
}

function blobToBase64(blob: Blob) {
  return new Promise((resolve, reject) => {
    const reader: any = new FileReader()
    reader.onloadend = () => resolve(reader.result?.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default new QZService()
