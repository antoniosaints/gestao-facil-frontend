export const money = (value: unknown) =>
  value === null || value === undefined
    ? 'Não informado'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
export const quantity = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(value ?? 0))
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const dateLabel = (value: string) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : '—'
export function decimal(value: string | number, precision = 2): number {
  const text = String(value).trim()
  if (!/^\d+(?:[,.]\d+)?$/.test(text))
    throw new Error('Informe um número positivo, sem separador de milhares.')
  const fraction = text.split(/[,.]/)[1] || ''
  if (fraction.length > precision) throw new Error(`Use até ${precision} casas decimais.`)
  const result = Number(text.replace(',', '.'))
  if (!Number.isFinite(result)) throw new Error('Valor inválido.')
  return result
}
export const errorMessage = (error: unknown) => {
  const e = error as {
    response?: { status?: number; data?: { message?: string; erro?: string } }
    message?: string
  }
  if (e.response?.status === 404) {
    const message = e.response.data?.message || e.response.data?.erro
    return message &&
      !/^Request failed with status code|Cannot (GET|POST|PATCH|PUT|DELETE)/.test(message)
      ? message
      : 'Este recurso não foi encontrado na API. Atualize a página e tente novamente. Se persistir, confira a atualização do servidor.'
  }
  return e.response?.status === 409
    ? e.response?.data?.message ||
        'Outro usuário alterou este registro. Recarregue e confira os dados antes de salvar.'
    : e.response?.data?.message ||
        e.response?.data?.erro ||
        e.message ||
        'Não foi possível completar. Confira sua conexão e tente novamente.'
}
