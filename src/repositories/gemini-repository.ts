import http from '@/utils/axios'

export type GeminiChatImage = { data: string; mimeType: string; name?: string }
export type CoreIaAttachment = GeminiChatImage
export type CoreIaAction = {
  id: string
  title: string
  fields: { label: string; value: string }[]
  expiresAt: string
  state?: 'pending' | 'done'
}
export type CoreIaSource = { id: string; title: string; routes: string[] }
export type CoreIaReply = {
  reply: string
  history: any[]
  transcript?: string
  pendingActions?: CoreIaAction[]
  actionId?: string
  sources?: CoreIaSource[]
}
function attachmentPayload(value?: CoreIaAttachment | null) {
  return value ? { data: value.data, mimeType: value.mimeType, name: value.name } : undefined
}
export class GeminiRepository {
  static async chat(
    message: string,
    history: any[] = [],
    image?: GeminiChatImage | null,
    audio?: CoreIaAttachment | null,
  ) {
    const response = await http.post(
      '/gemini/chat',
      {
        prompt: message,
        history,
        image: attachmentPayload(image),
        audio: attachmentPayload(audio),
      },
      { timeout: 180_000 },
    )
    return response.data as { status: number; message: string; data: CoreIaReply }
  }
  static async decide(id: string, decision: 'confirm' | 'cancel', history: any[] = []) {
    const response = await http.post(
      '/gemini/chat',
      { confirmation: { id, decision }, history },
      { timeout: 90_000 },
    )
    return response.data as { status: number; message: string; data: CoreIaReply }
  }
}
