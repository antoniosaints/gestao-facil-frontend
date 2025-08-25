import router from '@/router'

export const goTo = (url: string) => router.push(url)
export const goBack = () => router.go(-1)
export const goForward = () => router.go(1)
