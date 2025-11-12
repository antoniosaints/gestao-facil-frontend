import http from '@/utils/axios'
export class ImpressaoRepository {
  static async getCertificado() {
    const res = await http.get('/printer/cert/getCert')
    return String(res.data)
  }
  static async downloadCertificado() {
    const res = await http.get('/printer/cert/downloadCert', {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'certificado.crt'
    a.click()
    window.URL.revokeObjectURL(url)
  }
  static async getSignature(signature: any) {
    const res = await http.post('/printer/cert/signature', signature, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
    return String(res.data)
  }
}
