import { io } from "socket.io-client";

// ajuste a URL para seu backend
export const socket = io(import.meta.env.VITE_BACKEND_URL as string || "http://localhost:3000");

export function entrarNaConta(contaId: number) {
  socket.emit("entrarNaConta", contaId);
}
