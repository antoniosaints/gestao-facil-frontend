import type { Usuarios } from '@/types/schemas'
import http from '@/utils/axios'

interface updateProfile {
  nome: string
  telefone: string
  biografia: string
  endereco: string
  profile: string
}
export class UsuarioRepository {
  static async whoami() {
    const data = await http.get(`/usuarios/whoami`)
    return data.data
  }
  static async get(id: number) {
    const { data } = await http.get(`/usuarios/get/${id}`)
    return data.data
  }
  static async delete(id: number) {
    const data = await http.delete(`/usuarios/delete/${id}`)
    return data.data
  }
  static async save(data: Omit<Usuarios, 'id'>) {
    await http.post(`/usuarios/salvar`, data)
  }
  static async update(data: Usuarios) {
    await http.post(`/usuarios/salvar`, data)
  }
  static async updateProfile(data: Partial<updateProfile>) {
    await http.post(`/usuarios/updatePerfil`, data)
  }
}
