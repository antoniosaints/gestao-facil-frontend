import { io, Socket } from 'socket.io-client'

let socket: Socket

export function getSocket() {
  if (!socket) {
    socket = io((import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:3000', {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      console.log('Conectado ao servidor socket:', socket.id)
    })
  }
  return socket
}

export function entrarNaConta(contaId: number) {
  const s = getSocket()
  s.emit('entrarNaConta', contaId)
}
export function sairDaConta(contaId: number) {
  const s = getSocket()
  s.emit('sairDaConta', contaId)
}
export function updateVendasTable() {
  const s = getSocket()
  s.emit('updateTable:vendas')
}
