<template>
  <div class="p-4 border rounded w-96">
    <h2 class="text-lg font-bold mb-2">Selecionar Impressora</h2>

    <button @click="loadPrinters" class="bg-blue-600 text-white px-3 py-2 rounded">
      Buscar Impressoras
    </button>

    <select v-if="printers.length" v-model="selected" class="border w-full mt-2 p-2 rounded">
      <option disabled value="">Selecione...</option>
      <option v-for="p in printers" :key="p" :value="p">{{ p }}</option>
    </select>

    <button v-if="selected" @click="save" class="bg-green-600 text-white px-3 py-2 rounded mt-2 w-full">
      Salvar Impressora
    </button>

    <p v-if="saved" class="text-green-700 mt-2 text-sm">
      Impressora salva: {{ saved }}
    </p>
  </div>
</template>

<script setup lang="ts">
import qzTray from "@/utils/qzTray";
import { ref } from "vue";

const printers = ref([]);
const selected = ref<string>("");
const saved = ref(qzTray.getSavedPrinter());

async function loadPrinters(): Promise<void> {
  printers.value = await qzTray.getPrinters();
}

function save() {
  qzTray.savePrinter(selected.value);
  saved.value = selected.value;
  printers.value = [];
  selected.value = "";
}
</script>
