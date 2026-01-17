import http from '@/utils/axios'
export class GeminiRepository {
  static async chat(message: string, history?: any[]) {
    const data = await http.post(`/gemini/chat`, {
      prompt: message,
      history,
    })
    return data.data
  }
}
