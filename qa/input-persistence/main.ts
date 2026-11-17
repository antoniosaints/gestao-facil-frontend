import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import Toast from 'vue-toastification'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import 'vue-toastification/dist/index.css'
import '../../src/assets/main.css'
import '../../src/assets/style.css'
import '../../src/modofacil/assets/interface.css'
import http from '../../src/utils/axios'
import { useUiStore } from '../../src/stores/ui/uiStore'
import App from './App.vue'
import PersonFormPage from '../../src/modofacil/pages/PersonFormPage.vue'
import PersonContactFormPage from '../../src/modofacil/pages/PersonContactFormPage.vue'
const context = await (await fetch('/qa/context')).json()
http.defaults.baseURL = '/api'
localStorage.setItem('gestao_facil:token', context.token)
window.addEventListener('pagehide', () => {
  if (localStorage.getItem('gestao_facil:token') === context.token)
    localStorage.removeItem('gestao_facil:token')
})
const pinia = createPinia()
const ui = useUiStore(pinia)
ui.usuarioLogged = context.user
ui.appModules = {}
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: { template: '<span />' } },
    { path: '/modofacil/pessoas/nova', component: PersonFormPage },
    { path: '/modofacil/pessoas/:id/editar', component: PersonContactFormPage },
  ],
})
createApp(App, { defaults: context.defaults })
  .component('DatePicker', VueDatePicker)
  .use(pinia)
  .use(router)
  .use(Toast)
  .mount('#app')
