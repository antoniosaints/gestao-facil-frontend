import type { Usuarios } from '@/types/schemas'
import http from '@/utils/axios'
export class UsuarioRepository {
  static async whoami() {
    const data = await http.get(`/usuarios/whoami`)
    return data.data
  }
  static async save(data: Omit<Usuarios, 'id'>) {
    await http.post(`/usuarios/salvar`, data)
  }
}
