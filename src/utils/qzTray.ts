import qz, { type PrintData } from 'qz-tray'
import { ImpressaoRepository } from '@/repositories/impressao-repository'
const sizeMap: any = {
  A4: { width: 8.27, height: 11.69 }, // polegadas
  A5: { width: 5.83, height: 8.27 },
  Letter: { width: 8.5, height: 11 },
  '80mm': { width: 3.15, height: 11.69 }, // 80mm térmica
}
const typeMap: Record<string, any> = {
  pdf: { type: 'pdf', format: 'base64', flavor: null },
  html: { type: 'pixel', format: 'html', flavor: 'plain' },
  raw: { type: 'raw', format: 'plain', flavor: 'plain' },
  image: { type: 'image', format: 'base64', flavor: 'plain' },
}

interface Printer {
  content: any
  arquivo: 'pdf' | 'html' | 'raw' | 'image'
}
class QZService {
  async connect() {
    if (!qz.websocket.isActive()) {
      await qz.security.setCertificatePromise(
        async () => await ImpressaoRepository.getCertificado(),
      )
      await qz.security.setSignatureAlgorithm('SHA512')
      await qz.security.setSignaturePromise(
        async (toSign: any) => await ImpressaoRepository.getSignature(toSign),
      )
      await qz.websocket.connect()
    }
  }

  isConnected() {
    return !!qz.websocket?.isActive?.()
  }

  async disconnect() {
    if (qz.websocket.isActive()) {
      await qz.websocket.disconnect()
    }
  }

  async getPrinters() {
    await this.connect()
    return qz.printers.find()
  }

  savePrinter(printer: any) {
    localStorage.setItem('qz_printer', printer)
  }

  getSavedPrinter() {
    return localStorage.getItem('qz_printer')
  }
  getSavedSize() {
    return localStorage.getItem('qz_size_paper') || 'A4'
  }

  async print(data: Printer) {
    await this.connect()
    const printer = this.getSavedPrinter()
    const paper = this.getSavedSize()

    if (!printer) throw new Error('Nenhuma impressora salva.')

    const config = qz.configs.create(printer, {
      copies: 1,
      size: sizeMap[paper],
      units: 'in',
      jobName: 'Impressao - Gestao Facil',
    })
    const mapper = typeMap[data.arquivo]
    const pr = [
      { type: mapper.type, format: mapper.format, flavor: mapper.flavor, data: data.content },
    ]

    return qz.print(config, pr)
  }

  async printTermal(content: any) {
    await this.connect()
    const printer = this.getSavedPrinter()

    if (!printer) throw new Error('Nenhuma impressora salva.')

    const config = qz.configs.create(printer, {
      size: { width: 3.15, height: 11.69 },
      units: 'in',
    })
    const data = [{ type: 'raw', format: 'plain', data: content }]

    return qz.print(config, data)
  }
  async printNormal(content: any) {
    await this.connect()
    const printer = this.getSavedPrinter()
    const paper = this.getSavedSize()

    if (!printer) throw new Error('Nenhuma impressora salva.')

    const config = qz.configs.create(printer, {
      copies: 1,
      size: sizeMap[paper],
      units: 'in',
      jobName: 'Impressao - Gestao Facil',
    })
    const data = [{ type: 'pixel', format: 'html', flavor: 'plain', data: content }]

    return qz.print(config, data)
  }

  async printPDF(blob: Blob) {
    await this.connect()

    if (!this.isConnected()) {
      throw new Error('QZ Tray não conectado.')
    }

    const printer = this.getSavedPrinter()
    if (!printer) {
      throw new Error('Nenhuma impressora selecionada.')
    }

    const base64 = await blobToBase64(blob)

    const config = qz.configs.create(printer, {
      size: sizeMap[this.getSavedSize()],
      units: 'in',
      jobName: 'Impressao - Gestao Facil',
    })
    const data: PrintData[] = [
      {
        type: 'pdf',
        format: 'base64',
        data: base64 as string,
      },
    ]

    return qz.print(config, data)
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
