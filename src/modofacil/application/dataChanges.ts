import { reactive } from 'vue'
// Only revision numbers are shared; record data remains local to the mounted page.
const revisions = reactive<Record<string, number>>({})
function group(path: string) {
  if (path.includes('/estoque')) return 'produtos'
  if (path.includes('/servicos/ordens')) return 'ordens'
  if (path.includes('/financeiro')) return 'financeiro'
  return path.replace(/^\/modofacil\//, '').split('/')[0] || path
}
export function dataRevision(path = '*') {
  return revisions[group(path)] || 0
}
export function markDataChanged(path: string) {
  revisions['*'] = (revisions['*'] || 0) + 1
  const key = group(path)
  revisions[key] = (revisions[key] || 0) + 1
  if (key === 'vendas' || key === 'ordens') {
    revisions.produtos = (revisions.produtos || 0) + 1
    revisions.financeiro = (revisions.financeiro || 0) + 1
  }
}
