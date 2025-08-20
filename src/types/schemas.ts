export type Produto = {
  id?: number
  Uid: string
  nome: string
  descricao: string
  entradas: boolean
  saidas: boolean
  preco: number
  precoCompra: number
  unidade: string
  status: string
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
  status: string
  observacoes: string
  vendedor?: {
    id: number
    nome: string
  }
}
