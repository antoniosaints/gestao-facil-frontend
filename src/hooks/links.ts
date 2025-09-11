import router from '@/router'

export const goTo = (url: string) => {
  router.push(url)
  window.scrollTo(0, 0)
}
export const goBack = () => {
  router.go(-1)
}
export const goForward = () => {
  router.go(1)
}
