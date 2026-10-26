import http from '@/utils/axios'
export interface Configuration {
  modo: 'NORMAL' | 'FACIL'
  versao: number
  podeAlterar: boolean
}
function configuration(value: unknown): Configuration {
  const data = value as Partial<Configuration> | null
  if (
    !data ||
    !['NORMAL', 'FACIL'].includes(String(data.modo)) ||
    !Number.isSafeInteger(data.versao) ||
    Number(data.versao) < 0 ||
    typeof data.podeAlterar !== 'boolean'
  )
    throw new Error('Não foi possível validar a preferência da conta. Tente novamente.')
  return data as Configuration
}
export const configurationApi = {
  async get(): Promise<Configuration> {
    const { data } = await http.get('/modofacil/configuracao', {
      params: { _mfRead: crypto.randomUUID() },
    })
    return configuration(data.data ?? data)
  },
  async save(value: Pick<Configuration, 'modo' | 'versao'>): Promise<Configuration> {
    const { data } = await http.put('/modofacil/configuracao', value)
    return configuration(data.data ?? data)
  },
}
