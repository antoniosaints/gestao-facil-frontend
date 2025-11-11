import qz from 'qz-tray'
import http from './axios'
const sizeMap: any = {
  A4: { width: 8.27, height: 11.69 }, // polegadas
  A5: { width: 5.83, height: 8.27 },
  Letter: { width: 8.5, height: 11 },
  '80mm': { width: 3.15, height: 11.69 }, // 80mm térmica
}
class QZService {
  async connect() {
    if (!qz.websocket.isActive()) {
      await qz.security.setCertificatePromise(async () => {
        return http.get('/printer/cert/getCert').then((res) => {
          return String(res.data)
        })
      })
      await qz.security.setSignatureAlgorithm('SHA512')
      await qz.security.setSignaturePromise(async (toSign: any) => {
        return http
          .post('/printer/cert/signature', toSign, {
            headers: {
              'Content-Type': 'text/plain',
            },
          })
          .then((res) => {
            return String(res.data)
          })
      })
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
    const data = [
      {
        type: 'pdf',
        format: 'base64',
        data: base64,
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
