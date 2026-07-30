import { io, Socket } from 'socket.io-client'

let socket: Socket
let activeContaId: number | null = null

export function getSocket() {
  if (!socket) {
    socket = io((import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000', {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      console.log('Conectado ao servidor socket:', socket.id)
      if (activeContaId) socket.emit('entrarNaConta', activeContaId)
    })
  }
  return socket
}

export function entrarNaConta(contaId: number) {
  activeContaId = contaId
  const s = getSocket()
  if (s.connected) s.emit('entrarNaConta', contaId)
}
export function sairDaConta(contaId: number) {
  if (activeContaId === contaId) activeContaId = null
  const s = getSocket()
  if (s.connected) s.emit('sairDaConta', contaId)
}
export function updateVendasTable() {
  const s = getSocket()
  s.emit('updateTable:vendas')
}
