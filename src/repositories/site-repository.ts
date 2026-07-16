import http from '@/utils/axios'
import type { SitePublicConfig } from '@/pages/site/siteContent'

export class SiteRepository {
  static async getPublicConfig(): Promise<SitePublicConfig> {
    const { data } = await http.get('/site/config')
    return data.data as SitePublicConfig
  }

  static async getAdminConfig(): Promise<SitePublicConfig> {
    const { data } = await http.get('/admin/site')
    return data.data as SitePublicConfig
  }

  static async saveAdminConfig(payload: SitePublicConfig): Promise<SitePublicConfig> {
    const { data } = await http.put('/admin/site', payload)
    return data.data as SitePublicConfig
  }

  static async uploadSiteImage(file: File) {
    const form = new FormData()
    form.append('file', file)
    form.append('diretorio', 'site')

    const { data } = await http.post('/uploads/cloud/r2', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data as { url: string; publicUrl: string; reference?: string; key?: string }
  }
}
