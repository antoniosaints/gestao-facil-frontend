import { onMounted, onUnmounted } from 'vue'
import type { Socket } from 'socket.io-client'
import { getSocket } from '@/pluguins/socket'

export function useSocketEvent<T = any>(event: string, handler: (payload: T) => void | Promise<void>) {
  let socket: Socket | null = null

  onMounted(() => {
    socket = getSocket()
    socket.on(event, handler)
  })

  onUnmounted(() => {
    socket?.off(event, handler)
  })
}
