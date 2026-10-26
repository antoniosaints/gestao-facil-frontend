// Visual QA only: no external socket can be created in this harness.
const socket = {
  on: () => socket,
  off: () => socket,
  emit: () => socket,
  disconnect: () => socket,
  connected: false,
}
export const getSocket = () => socket
export const entrarNaConta = () => {}
export const sairDaConta = () => {}
export const disconnectSocket = () => {}
export const updateVendasTable = () => {}
