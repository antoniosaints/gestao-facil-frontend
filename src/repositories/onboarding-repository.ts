import http from '@/utils/axios'
import type {
  OnboardingConfig,
  OnboardingPreview,
  OnboardingPreviewInput,
} from '@/types/onboarding'

export class OnboardingRepository {
  static async config(): Promise<OnboardingConfig> {
    const response = await http.get<{ data: OnboardingConfig }>('/contas/onboarding/config')
    return response.data.data
  }
  static async preview(payload: OnboardingPreviewInput): Promise<OnboardingPreview> {
    const response = await http.post<{ data: OnboardingPreview }>(
      '/contas/onboarding/preview',
      payload,
    )
    return response.data.data
  }
}
