import qz from 'qz-tray'

class QZService {
  async connect() {
    if (!qz.websocket.isActive()) {
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

  async printTermal(content: any) {
    await this.connect()
    const printer = this.getSavedPrinter()
    if (!printer) throw new Error('Nenhuma impressora salva.')

    const config = qz.configs.create(printer)
    const data = [{ type: 'raw', format: 'plain', data: content }]

    return qz.print(config, data)
  }
  async printNormal(content: any) {
    await this.connect()
    const printer = this.getSavedPrinter()
    if (!printer) throw new Error('Nenhuma impressora salva.')

    const config = qz.configs.create(printer, { copies: 1, jobName: 'Impressao - Gestao Facil' })
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

    const config = qz.configs.create(printer)
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
