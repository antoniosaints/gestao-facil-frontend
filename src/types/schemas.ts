export type Produto = {
  id?: number
  Uid?: string
  nome: string
  codigo: string
  descricao: string
  entradas: boolean
  saidas: boolean
  preco: number | string
  precoCompra?: number | string
  unidade: string
  status?: string
  estoque: number
  minimo: number
}

export type Login = {
  email: string
  password: string
}

export type Vendas = {
  id: number
  Uid: string
  data: string
  valor: number
  status: string
  observacoes: string
  vendedor?: {
    id: number
    nome: string
  }
  cliente?: {
    id: number
    nome: string
  }
}
