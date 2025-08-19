import './assets/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(Toast, {
  positon: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
})

app.use(createPinia())
app.use(router)

app.mount('#app')
