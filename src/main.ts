import './assets/main.css'
import './assets/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './utils/worker'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'

import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { socket } from './pluguins/socket'

const app = createApp(App)

app.use(Toast, {
  position: POSITION.TOP_RIGHT,
  transition: 'Vue-Toastification__fade',
  timeout: 1500,
  closeOnClick: true,
  pauseOnHover: true,
  newestOnTop: true,
  hideProgressBar: true,
})

app.use(createPinia())
app.use(router)

app.component('DatePicker', VueDatePicker)

app.config.globalProperties.$socket = socket;
app.mount('#app')
