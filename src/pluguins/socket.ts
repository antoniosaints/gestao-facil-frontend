import { io, Socket } from 'socket.io-client'

let socket: Socket | undefined
let activeContaId: number | null = null

export function getSocket() {
  if (!socket) {
    socket = io((import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000', {
      transports: ['websocket'],
      auth: (callback) => {
        callback({ token: localStorage.getItem('gestao_facil:token') })
      },
    })
    const connectedSocket = socket

    connectedSocket.on('connect', () => {
      console.log('Conectado ao servidor socket:', connectedSocket.id)
      if (activeContaId) connectedSocket.emit('entrarNaConta', activeContaId)
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
export function disconnectSocket() {
  activeContaId = null
  socket?.disconnect()
  socket = undefined
}
export function updateVendasTable() {
  const s = getSocket()
  s.emit('updateTable:vendas')
}
