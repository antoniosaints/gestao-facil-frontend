import { createApp, defineComponent, h, ref } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory, RouterView, RouterLink } from 'vue-router'
import Toast from 'vue-toastification'
import '../../src/assets/main.css'
import '../../src/assets/style.css'
import 'vue-toastification/dist/index.css'
import ChatPage from '../../src/pages/agente/ChatPage.vue'
import CoreIaWidget from '../../src/components/ia/CoreIaWidget.vue'
import { useUiStore } from '../../src/stores/ui/uiStore'
import http from '../../src/utils/axios'

const pinia = createPinia()
const context = await (await fetch('/qa/context')).json()
localStorage.setItem('gestao_facil:token', context.token)
window.addEventListener('pagehide', () => {
  if (localStorage.getItem('gestao_facil:token') === context.token)
    localStorage.removeItem('gestao_facil:token')
})
http.defaults.baseURL = '/api'
http.defaults.headers.common.Authorization = `Bearer ${context.token}`
const ui = useUiStore(pinia)
ui.usuarioLogged = context.user
ui.appModules = { 'core-ia': true }
const saved = ref<any>(null)
async function refresh() {
  saved.value = (await http.get('/qa/state', { baseURL: '/' })).data
}
const Home = defineComponent({
  setup() {
    return () =>
      h('div', { class: 'space-y-4 p-4' }, [
        h('h1', { class: 'text-xl font-semibold' }, 'Conferência dos dados de teste'),
        h(
          'p',
          'Abra o Core IA pelo balão. Os cadastros abaixo vêm do banco desta conta temporária.',
        ),
        h(
          'button',
          { class: 'rounded-lg border px-4 py-3', onClick: refresh },
          'Atualizar conferência',
        ),
        saved.value
          ? h(
              'pre',
              {
                class: 'max-w-full overflow-auto rounded-xl border p-4 text-sm',
                'aria-label': 'Cadastros persistidos no banco de QA',
              },
              JSON.stringify(saved.value, null, 2),
            )
          : null,
      ])
  },
})
const app = createApp(
  defineComponent({
    setup() {
      return () =>
        h('div', { class: 'flex h-dvh flex-col bg-background text-foreground' }, [
          h(
            'nav',
            {
              class:
                'flex shrink-0 flex-wrap items-center gap-4 border-b bg-card px-4 py-3 text-sm',
            },
            [
              h('strong', 'QA isolado · API, Gemini e banco reais'),
              h(RouterLink, { to: '/chat/ia', class: 'underline' }, () => 'Chat completo'),
              h(RouterLink, { to: '/', class: 'underline' }, () => 'Balão e conferência'),
            ],
          ),
          h('div', { class: 'min-h-0 flex-1 p-4' }, [h(RouterView)]),
          h(CoreIaWidget),
        ])
    },
  }),
)
app.use(pinia)
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/chat/ia', name: 'ia', component: ChatPage },
    { path: '/', component: Home },
  ],
})
app.use(router)
app.use(Toast)
app.mount('#app')
