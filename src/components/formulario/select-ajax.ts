export interface SelectAjaxOption {
  id: string | number
  label: string
  caminho?: string
  disabled?: boolean
  record?: unknown
}

export interface SelectAjaxQuery {
  search: string
  page: number
  id?: string | number
}

export interface SelectAjaxResult {
  results: SelectAjaxOption[]
  hasMore?: boolean
}

export type SelectAjaxLoader = (query: SelectAjaxQuery) => Promise<SelectAjaxResult>
