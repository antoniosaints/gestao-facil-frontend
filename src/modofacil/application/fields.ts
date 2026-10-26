import { decimal } from './format'
export interface FieldDefinition {
  key: string
  label: string
  type?: 'text' | 'number' | 'boolean' | 'select'
  scale?: number
  nullable?: boolean
  numeric?: boolean
  options?: Array<[string, string]>
  group?: string
  hint?: string
}
const text = (key: string, label: string, group = 'Fiscal'): FieldDefinition => ({
  key,
  label,
  group,
})
const number = (key: string, label: string, scale = 2, group = 'Fiscal'): FieldDefinition => ({
  key,
  label,
  type: 'number',
  scale,
  group,
})
export const fiscalFields: FieldDefinition[] = [
  text('ncm', 'NCM'),
  text('cest', 'CEST'),
  text('cfop', 'CFOP'),
  number('origem', 'Origem', 0),
  text('codigoProduto', 'Código fiscal'),
  text('ean', 'EAN'),
  text('tipoItem', 'Tipo de item'),
  text('icmsCsosn', 'CSOSN'),
  text('icmsCst', 'CST ICMS'),
  text('pisCst', 'CST PIS'),
  text('cofinsCst', 'CST COFINS'),
  text('icmsModBcSt', 'Modalidade BC ST'),
  number('icmsMva', 'MVA', 4),
  number('icmsReducaoBcSt', 'Redução BC ST', 4),
  number('icmsAliquotaSt', 'Alíquota ST', 4),
  number('fcpAliquota', 'Alíquota FCP', 4),
  number('fcpStAliquota', 'Alíquota FCP ST', 4),
  number('icmsDesoneradoValor', 'ICMS desonerado'),
  text('icmsDesoneradoMotivo', 'Motivo da desoneração'),
  number('icmsCreditoAliquota', 'Crédito ICMS', 4),
  text('ipiCst', 'CST IPI'),
  text('ipiCodigoEnquadramento', 'Enquadramento IPI'),
  number('difalAliquotaInterna', 'Alíquota interna DIFAL', 4),
  number('difalFcpAliquota', 'FCP DIFAL', 4),
  number('aliquotaIcms', 'Alíquota ICMS'),
  number('aliquotaIpi', 'Alíquota IPI'),
  number('aliquotaPis', 'Alíquota PIS'),
  number('aliquotaCofins', 'Alíquota COFINS'),
  number('issAliquota', 'Alíquota ISS'),
]
const flag = (key: string, label: string): FieldDefinition => ({
  key,
  label,
  type: 'boolean',
  nullable: false,
  group: 'Operação',
})
export const variantFields: FieldDefinition[] = [
  { ...text('nomeVariante', 'Nome da variante', 'Identificação'), nullable: false },
  text('codigo', 'Código / SKU', 'Identificação'),
  number('precoPromocional', 'Preço promocional', 2, 'Preços'),
  flag('entradas', 'Permite entradas'),
  flag('saidas', 'Permite saídas'),
  flag('controlaEstoque', 'Controla estoque'),
  flag('producaoLocal', 'Produção local'),
  flag('mostrarNoPdv', 'Visível no PDV'),
  flag('mostrarNoCatalogo', 'Visível no catálogo'),
  flag('materiaPrima', 'Matéria-prima'),
  number('custoMedioProducao', 'Custo médio de produção', 2, 'Preços'),
  ...fiscalFields,
]
export const personFields: FieldDefinition[] = [
  text('documento', 'CPF ou CNPJ', 'Documento'),
  text('ie', 'Inscrição estadual', 'Documento'),
  text('im', 'Inscrição municipal', 'Documento'),
  text('municipio', 'Código do município', 'Documento'),
  text('cep', 'CEP', 'Endereço'),
  text('endereco', 'Endereço', 'Endereço'),
  text('numero', 'Número', 'Endereço'),
  text('bairro', 'Bairro', 'Endereço'),
  text('cidade', 'Cidade', 'Endereço'),
  text('estado', 'Estado (UF)', 'Endereço'),
  text('observacaos', 'Observações', 'Cadastro'),
  {
    key: 'tipo',
    label: 'Tipo de pessoa',
    type: 'select',
    nullable: false,
    group: 'Cadastro',
    options: [
      ['CLIENTE', 'Cliente'],
      ['FORNECEDOR', 'Fornecedor'],
    ],
  },
  {
    key: 'status',
    label: 'Situação',
    type: 'select',
    nullable: false,
    group: 'Cadastro',
    options: [
      ['ATIVO', 'Ativa'],
      ['INATIVO', 'Inativa'],
      ['BLOQUEADO', 'Bloqueada'],
    ],
  },
]
export const serviceFields = [
  ...fiscalFields.filter((f) =>
    [
      'ncm',
      'cest',
      'cfop',
      'origem',
      'aliquotaIcms',
      'aliquotaIpi',
      'aliquotaPis',
      'aliquotaCofins',
      'codigoProduto',
      'issAliquota',
    ].includes(f.key),
  ),
  flag('status', 'Serviço ativo'),
]
export function fieldValue(field: FieldDefinition, value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null
  if (field.type === 'boolean') return value === true || value === 'true'
  if (field.type === 'select' && field.numeric) return decimal(String(value), 0)
  if (field.type === 'number') return decimal(String(value), field.scale ?? 2)
  return String(value).trim() || null
}
export function changedFields(
  fields: FieldDefinition[],
  draft: Record<string, unknown>,
  initial: Record<string, unknown>,
) {
  const body: Record<string, unknown> = {}
  for (const field of fields) {
    const value = fieldValue(field, draft[field.key])
    if (value !== fieldValue(field, initial[field.key])) {
      if (value === null && field.nullable === false) throw new Error(`Preencha ${field.label}.`)
      body[field.key] = value
    }
  }
  return body
}
