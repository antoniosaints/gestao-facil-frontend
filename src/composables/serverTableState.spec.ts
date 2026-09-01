import { beforeEach, describe, expect, it } from 'vitest'
import {
  getServerTableStorageKey,
  loadServerTableState,
  restoreServerTableFilters,
  saveServerTableState,
} from './serverTableState'

describe('estado persistido da DataTable', () => {
  beforeEach(() => window.localStorage.clear())

  it('salva e restaura paginação, busca, ordenação e filtros sem o gatilho update', () => {
    saveServerTableState('lancamentos', {
      pageIndex: 1,
      pageSize: 20,
      search: 'internet',
      sorting: [{ id: 'descricao', desc: true }],
      columnVisibility: { categoriaId: false },
      filters: { status: 'PENDENTE', inicio: '2026-09-01', update: true },
    })

    expect(loadServerTableState('lancamentos')).toMatchObject({
      pageIndex: 1,
      pageSize: 20,
      search: 'internet',
      sorting: [{ id: 'descricao', desc: true }],
      filters: { status: 'PENDENTE', inicio: '2026-09-01' },
    })
    expect(window.localStorage.getItem(getServerTableStorageKey('lancamentos'))).not.toContain('"update"')
  })

  it('restaura somente filtros que a tela atual reconhece', () => {
    const filters = { status: 'TODOS', categoriaId: null as number | null, update: false }

    restoreServerTableFilters(filters, {
      status: 'PAGO',
      categoriaId: 8,
      filtroRemovido: 'ignorar',
      update: true,
    })

    expect(filters).toEqual({ status: 'PAGO', categoriaId: 8, update: false })
  })

  it('ignora estado inválido para não comprometer a tabela', () => {
    window.localStorage.setItem(
      getServerTableStorageKey('invalido'),
      JSON.stringify({ version: 1, pageIndex: -1, pageSize: 20 }),
    )

    expect(loadServerTableState('invalido')).toBeNull()
  })
})
