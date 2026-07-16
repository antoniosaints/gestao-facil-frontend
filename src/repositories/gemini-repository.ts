import http from '@/utils/axios'

export type GeminiChatImage = {
  data: string
  mimeType: string
  name?: string
}

export class GeminiRepository {
  static async chat(message: string, history?: any[], image?: GeminiChatImage | null) {
    const data = await http.post(`/gemini/chat`, {
      prompt: message,
      history,
      image: image || undefined,
    })
    return data.data
  }
}
