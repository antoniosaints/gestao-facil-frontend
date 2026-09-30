<script setup lang="ts">
import { ref } from 'vue'
import { LoaderCircle, MapPinCheck, Search } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NotasFiscaisRepository, type GeranetCity } from '@/repositories/notas-fiscais-repository'
const emit = defineEmits<{ select: [city: GeranetCity] }>()
const props = defineProps<{ selectable?: boolean }>()
const query = ref('')
const cities = ref<GeranetCity[]>([])
const busy = ref(false)
const searched = ref(false)
const error = ref('')
async function search() {
  if (busy.value || query.value.trim().length < 2) return
  busy.value = true
  searched.value = false
  error.value = ''
  cities.value = []
  try {
    cities.value = await NotasFiscaisRepository.buscarCidadesGeranet(query.value.trim())
    searched.value = true
  } catch (cause: any) {
    error.value =
      cause?.response?.data?.error?.message ||
      'Não foi possível consultar as cidades atendidas agora.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section
    class="space-y-3 rounded-xl border bg-card p-4"
    aria-label="Cidades atendidas pela Geranet"
  >
    <div>
      <h2 class="flex items-center gap-2 font-semibold">
        <MapPinCheck class="size-4 text-primary" />Cidades atendidas pela Geranet
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Busque pelo nome da cidade ou código IBGE para consultar a disponibilidade de emissão.
      </p>
    </div>
    <form class="flex flex-wrap items-end gap-2" @submit.prevent="search">
      <div class="min-w-0 flex-1 space-y-1.5">
        <Label for="geranet-city-query">Cidade ou código IBGE</Label
        ><Input
          id="geranet-city-query"
          v-model="query"
          placeholder="Ex.: Araguaína ou 1702109"
          maxlength="120"
          :disabled="busy"
        />
      </div>
      <Button type="submit" variant="outline" :disabled="busy || query.trim().length < 2"
        ><LoaderCircle v-if="busy" class="size-4 animate-spin" /><Search
          v-else
          class="size-4"
        />Buscar</Button
      >
    </form>
    <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>
    <p v-else-if="searched && !cities.length" class="text-sm text-muted-foreground">
      Nenhuma cidade atendida foi encontrada para esta busca.
    </p>
    <ul v-else-if="cities.length" class="max-h-72 space-y-2 overflow-y-auto">
      <li
        v-for="city in cities"
        :key="city.codigoIbge"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
      >
        <div>
          <p class="font-semibold">{{ city.nome }} — {{ city.uf }}</p>
          <p class="text-xs text-muted-foreground">
            IBGE {{ city.codigoIbge }} · {{ city.provedor
            }}<span v-if="city.versao"> · {{ city.versao }}</span>
          </p>
        </div>
        <Button
          v-if="props.selectable"
          type="button"
          size="sm"
          variant="outline"
          :aria-label="`Usar município ${city.nome}`"
          @click="emit('select', city)"
          >Usar município</Button
        >
      </li>
    </ul>
  </section>
</template>
