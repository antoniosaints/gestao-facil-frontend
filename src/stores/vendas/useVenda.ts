import { ref } from 'vue'
import { defineStore } from 'pinia'
import http from '@/utils/axios'
import type { Vendas } from '@/types/schemas'

export const useVendaStore = defineStore('vendaStore', () => {
  const id = ref(0)
  const data = ref<Vendas>()

  const dataDefault = ref<Partial<Vendas>>({})

  const get = async (id: number) => {
    const data = await http.get(`/vendas/${id}`)
    return data.data
  }

  const remove = async (id: number) => {
    await http.delete(`/vendas/${id}`)
  }

  const update = async (data: Partial<Vendas>, id: number) => {
    data.id = id
    await http.post(`/vendas`, data)
  }

  const save = async (data: Omit<Vendas, 'id'>) => {
    await http.post(`/vendas`, data)
  }

  const getResumoMensal = async () => {
    const { data } = await http.get(`/vendas/resumo/mensal`)
    return data
  }

  const getCupomPDF = async (id: number) => {
    const data = await http.get(`/vendas/cupom-pdf/${id}`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.download = `cupom_nf_${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const getAllSelect2 = async (q: string | undefined) => {
    const { data } = await http.get('/vendas?search=' + (q || ''))

    return data.data.map((row: any) => {
      return {
        id: row.id,
        label: row.nome,
      }
    })
  }
  const getOneSelect2 = async (id: number | string) => {
    const { data } = await http.get('/vendas/' + id)

    return {
      id: data.data.id,
      label: data.data.nome,
    }
  }

  return {
    id,
    get,
    remove,
    save,
    update,
    getAllSelect2,
    getOneSelect2,
    getCupomPDF,
    getResumoMensal,
    data,
    dataDefault,
  }
})
