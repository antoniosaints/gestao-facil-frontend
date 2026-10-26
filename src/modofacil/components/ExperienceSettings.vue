<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { configurationApi } from '../adapters/configuration'
import { experience, refreshExperience } from '../application/experience'
import { errorMessage } from '../application/format'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, CircleCheck, LayoutGrid, LoaderCircle, Sparkles } from 'lucide-vue-next'
import { surfaceClasses } from '../application/ui'
defineProps<{ inheritTheme?: boolean }>()
const options = [
  {
    value: 'NORMAL' as const,
    label: 'Normal',
    description: 'Todos os recursos na interface completa.',
    icon: LayoutGrid,
  },
  {
    value: 'FACIL' as const,
    label: 'Modo Fácil',
    description: 'Telas próprias, tarefas guiadas e informações resumidas.',
    icon: Sparkles,
  },
]
const router = useRouter()
const selected = ref<'NORMAL' | 'FACIL'>('NORMAL')
const busy = ref(false)
const error = ref('')
const message = ref('')
async function load() {
  await refreshExperience()
  if (experience.configuration) selected.value = experience.configuration.modo
}
onMounted(load)
async function save() {
  if (!experience.configuration?.podeAlterar) return
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    experience.configuration = await configurationApi.save({
      modo: selected.value,
      versao: experience.configuration.versao,
    })
    experience.changed = false
    message.value = 'Experiência atualizada para toda a conta.'
  } catch (e) {
    error.value = errorMessage(e)
    if ((e as any).response?.status === 409) await load()
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <Card
    class="rounded-t-none bg-background"
    :class="
      inheritTheme
        ? ''
        : [surfaceClasses, 'modo-facil !rounded-[8px] !border-border !bg-card !text-foreground']
    "
  >
    <form @submit.prevent="save">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 font-normal">
          <LayoutGrid
            class="h-5 w-5"
            :class="inheritTheme ? 'text-primary' : 'text-blue-600 dark:text-blue-300'"
            aria-hidden="true"
          />
          Experiência do sistema
        </CardTitle>
        <CardDescription :class="inheritTheme ? '' : '!text-muted-foreground'">
          A escolha vale para todos os usuários desta conta. Seus dados e permissões são
          preservados.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <p
          v-if="experience.loading"
          role="status"
          class="flex items-center gap-2 text-sm"
          :class="inheritTheme ? 'text-muted-foreground' : 'text-muted-foreground'"
        >
          <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />Carregando informações…
        </p>
        <div
          v-if="error || experience.error"
          role="alert"
          class="space-y-3 rounded-md border p-4 text-sm"
          :class="
            inheritTheme
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300'
          "
        >
          <p>{{ error || experience.error }}</p>
          <Button
            type="button"
            variant="outline"
            :disabled="busy || experience.loading"
            @click="load"
            >Tentar novamente</Button
          >
        </div>
        <p
          v-if="message"
          role="status"
          class="flex items-center gap-2 rounded-md border p-3 text-sm"
          :class="
            inheritTheme
              ? 'border-primary/30 bg-primary/5 text-foreground'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
          "
        >
          <CircleCheck class="h-4 w-4 shrink-0" aria-hidden="true" />{{ message }}
        </p>
        <fieldset
          v-if="experience.configuration"
          :disabled="busy || experience.loading || !experience.configuration.podeAlterar"
          class="min-w-0 space-y-4"
          :class="busy || !experience.configuration.podeAlterar ? 'opacity-60' : ''"
        >
          <legend class="mb-3 text-sm font-medium">Como sua equipe prefere trabalhar?</legend>
          <div class="grid gap-4 lg:grid-cols-2">
            <label
              v-for="option in options"
              :key="option.value"
              class="relative !space-y-0 flex cursor-pointer items-start gap-3 rounded-md border p-5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2"
              :class="
                inheritTheme
                  ? [
                      selected === option.value
                        ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                        : 'bg-body/60 hover:border-primary/50 hover:bg-body',
                      'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-background',
                    ]
                  : [
                      selected === option.value
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                        : 'border-border bg-card hover:bg-muted/50',
                      'has-[:focus-visible]:ring-blue-500',
                    ]
              "
            >
              <input
                v-model="selected"
                type="radio"
                :value="option.value"
                name="experience"
                class="sr-only"
              />
              <span
                class="shrink-0 rounded-xl border p-3 shadow-sm"
                :class="
                  inheritTheme
                    ? 'bg-background text-primary'
                    : 'border-border bg-card text-blue-600 dark:text-blue-300'
                "
                ><component :is="option.icon" class="h-6 w-6" aria-hidden="true"
              /></span>
              <span class="min-w-0 flex-1"
                ><strong class="block text-sm font-semibold">{{ option.label }}</strong
                ><span
                  class="mt-1 block text-sm"
                  :class="inheritTheme ? 'text-muted-foreground' : 'text-muted-foreground'"
                  >{{ option.description }}</span
                ></span
              >
              <CircleCheck
                v-if="selected === option.value"
                class="h-5 w-5 shrink-0"
                :class="inheritTheme ? 'text-primary' : 'text-blue-600 dark:text-blue-300'"
                aria-hidden="true"
              /><span v-else class="h-5 w-5 shrink-0 rounded-full border-2" aria-hidden="true" />
            </label>
          </div>
        </fieldset>
        <p
          v-if="experience.configuration && !experience.configuration.podeAlterar"
          class="text-sm"
          :class="inheritTheme ? 'text-muted-foreground' : 'text-muted-foreground'"
        >
          Somente o administrador pode alterar esta escolha.
        </p>
        <p
          class="text-sm"
          :class="inheritTheme ? 'text-muted-foreground' : 'text-muted-foreground'"
        >
          O estilo de navegação do Normal é independente. Alguns módulos ainda estão em adaptação;
          consulte a cobertura no menu Mais.
        </p>
      </CardContent>
      <CardFooter class="flex flex-wrap items-center justify-end gap-3">
        <Button
          v-if="experience.configuration"
          type="button"
          variant="outline"
          class="mr-auto"
          @click="router.push(experience.configuration.modo === 'FACIL' ? '/modofacil' : '/')"
          >{{
            experience.configuration.modo === 'FACIL' ? 'Entrar no Modo Fácil' : 'Ir para o Normal'
          }}<ArrowRight class="h-4 w-4" aria-hidden="true"
        /></Button>
        <Button
          type="submit"
          :disabled="busy || experience.loading || !experience.configuration?.podeAlterar"
          :class="
            inheritTheme ? '' : '!border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700'
          "
        >
          <LoaderCircle v-if="busy" class="h-4 w-4 animate-spin" aria-hidden="true" /><CircleCheck
            v-else
            class="h-4 w-4"
            aria-hidden="true"
          />
          {{ busy ? 'Salvando…' : 'Salvar experiência da conta' }}
        </Button>
      </CardFooter>
    </form>
  </Card>
</template>
