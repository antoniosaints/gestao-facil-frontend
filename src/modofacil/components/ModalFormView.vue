<script setup lang="ts">
import { computed, defineAsyncComponent, provide } from 'vue'
import { forms } from '../application/formDialogs'
import { modalFormKey, type FormEntry } from '../application/modalWorkspace'
import { formReturnKey } from '../application/formReturn'
import ListLoading from './ListLoading.vue'
import FormLoadError from './FormLoadError.vue'
const props = defineProps<{ entry: FormEntry }>()
provide(modalFormKey, props.entry)
provide(
  formReturnKey,
  computed(() => props.entry.origin),
)
const Form = defineAsyncComponent({
  loader: async () => (await forms[props.entry.target.form].component()).default,
  loadingComponent: ListLoading,
  errorComponent: FormLoadError,
  delay: 0,
})
</script>
<template>
  <div
    class="[&_.mf-page]:!space-y-3 [&_.mf-head]:hidden [&_.mf-page_h1]:hidden [&_.mf-page>header]:hidden [&_.mf-page>section>header]:hidden [&_.mf-page>h1]:hidden [&_.mf-page>a:first-child]:hidden [&_.mf-page>form]:!p-0 [&_.mf-page>form]:!border-0 [&_.mf-page>section]:!border-0 [&_.mf-page>section]:!p-0"
  >
    <component :is="Form" />
  </div>
</template>
