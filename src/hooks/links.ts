import router from '@/router'

export const goTo = async (url: string) => {
  if (router.currentRoute.value.path === url) {
    await router.replace({ path: '/redirect' }) // rota temporária
    await router.replace({ path: url }) // volta pra rota certa
  } else {
    await router.push({ path: url })
  }
}
export const goBack = () => router.go(-1)
export const goForward = () => router.go(1)
