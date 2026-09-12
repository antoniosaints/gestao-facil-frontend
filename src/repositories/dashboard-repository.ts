import http from '@/utils/axios'

export type DashboardWidgetLayout = {
  id: string
  visible: boolean
  order: number
  span: number
}

type DashboardLayoutResponse = {
  layout: DashboardWidgetLayout[] | null
  source: 'USER' | 'CONTA' | 'DEFAULT'
  canCustomize: boolean
}

export class DashboardRepository {
  static async getLayout() {
    const { data } = await http.get('/dashboard/layout')
    return data.data as DashboardLayoutResponse
  }

  static async saveLayout(layout: DashboardWidgetLayout[]) {
    const { data } = await http.put('/dashboard/layout', { layout })
    return data.data
  }

  static async saveDefaultLayout(layout: DashboardWidgetLayout[]) {
    const { data } = await http.put('/dashboard/layout/default', { layout })
    return data.data
  }
}
