import type { Row } from '../adapters/domain'
export const emptyPerson = (type = 'CLIENTE') => ({
  nome: '',
  tipo: type,
  status: 'ATIVO',
  telefone: '',
  email: '',
  whastapp: '',
  documento: '',
  ie: '',
  im: '',
  municipio: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  observacaos: '',
})
export type PersonForm = ReturnType<typeof emptyPerson>
export function personPayload(form: PersonForm, initial?: Row) {
  const body: Record<string, string | null> = {}
  const defaults = emptyPerson()
  for (const key of Object.keys(form) as (keyof PersonForm)[]) {
    const value = form[key].trim() || null
    const previous = initial ? String(initial[key] ?? defaults[key]).trim() || null : null
    if (!initial || value !== previous) body[key] = value
  }
  if (!form.nome.trim() || form.nome.trim().length < 2)
    throw new Error('Informe um nome com pelo menos 2 caracteres.')
  if (!['CLIENTE', 'FORNECEDOR'].includes(form.tipo)) throw new Error('Escolha o tipo de pessoa.')
  return body
}
