import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAccountCreateStore = defineStore('accountCreateStore', () => {
  const form = ref({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    storeName: '',
    segment: '',
    cnpj: '',
    employees: '',
    terms: false,
    newsletter: false,
  })
  return { form }
})
