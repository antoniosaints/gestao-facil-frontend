import { shallowRef } from 'vue'
import { appAccessIssue } from '@/utils/appAccess'

export const appAccessPrompt = shallowRef<ReturnType<typeof appAccessIssue>>(null)

export function promptAppAccess(data: unknown) {
  const issue = appAccessIssue(data)
  if (issue) appAccessPrompt.value = issue
}
