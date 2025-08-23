import './assets/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { POSITION } from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(Toast, {
  positon: POSITION.TOP_RIGHT,
  transition: 'Vue-Toastification__fade',
  timeout: 1500,
  closeOnClick: true,
  pauseOnHover: true,
  newestOnTop: true,
  hideProgressBar: true
})

app.use(createPinia())
app.use(router)

app.mount('#app')
