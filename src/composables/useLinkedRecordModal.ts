import { onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { linkedRecordId } from '@/components/navigation/linkedRecord'

export function useLinkedRecordModal(options: {
  getId?: () => unknown
  isOpen: () => boolean
  show: (id: number) => unknown
  close: () => void
  returnTo: () => Parameters<ReturnType<typeof useRouter>['replace']>[0]
}) {
  const route = useRoute()
  const router = useRouter()
  const getId = options.getId ?? (() => route?.params?.id)
  watch(
    () => linkedRecordId(getId()),
    (id, previousId) => {
      if (id) void options.show(id)
      else if (previousId) options.close()
    },
    { immediate: true },
  )
  watch(options.isOpen, (open) => {
    if (!open && linkedRecordId(getId())) void router.replace(options.returnTo())
  })
  onBeforeUnmount(options.close)
}
