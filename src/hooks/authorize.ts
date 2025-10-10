import type { Usuarios } from '@/types/schemas'

export const hasPermission = (usuario: Usuarios, permission: number) => {
  let levelPermission = 0
  switch (usuario.permissao) {
    case 'root':
      levelPermission = 5
      break
    case 'admin':
      levelPermission = 4
      break
    case 'gerente':
      levelPermission = 3
      break
    case 'tecnico':
    case 'vendedor':
      levelPermission = 2
      break
    case 'usuario':
      levelPermission = 1
      break
    default:
      levelPermission = 0
      break
  }

  if (usuario.superAdmin) {
    levelPermission = 100
  }

  return levelPermission >= Number(permission)
}
