<template>
  <div class="p-4 bg-white dark:bg-gray-800 rounded shadow-md">
    <div class="flex justify-between items-center mb-4">
      <input
        v-model="search"
        @input="fetchData"
        placeholder="🔍 Buscar produtos..."
        class="w-1/3 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
      />
      <span class="text-sm text-gray-600">Total: {{ total }} itens</span>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full border border-gray-200 rounded-md">
        <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
          <tr>
            <th
              v-for="col in columns"
              :key="col.accessorKey"
              @click="sort(col.accessorKey)"
              class="px-4 py-2 text-left cursor-pointer select-none hover:bg-gray-200 transition"
            >
              {{ col.header }}
              <span v-if="sortField === col.accessorKey">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-t hover:bg-blue-50 transition dark:hover:bg-gray-700"
          >
            <td
              v-for="col in columns"
              :key="col.accessorKey"
              class="px-4 py-2 text-sm text-gray-800 dark:text-gray-200"
            >
              {{ row[col.accessorKey] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-between items-center">
      <button
        @click="prevPage"
        :disabled="page === 1"
        class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        ← Anterior
      </button>
      <span class="text-sm text-gray-600">
        Página {{ page }} de {{ totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="page >= totalPages"
        class="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        Próxima →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import http from "@/utils/axios";

const columns = [
  { header: "ID", accessorKey: "id" },
  { header: "Nome", accessorKey: "nome" },
  { header: "Preço", accessorKey: "preco" },
  { header: "Quantidade", accessorKey: "quantidade" },
];

const rows = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const sortField = ref("id");
const sortOrder = ref("asc");
const search = ref("");

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

const fetchData = async () => {
  const res = await http.post("/produtos/tabela", {
    page: page.value,
    pageSize: pageSize.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value,
    search: search.value,
  });
  rows.value = res.data.rows;
  total.value = res.data.total;
};

const sort = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
  fetchData();
};

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++;
    fetchData();
  }
};

const prevPage = () => {
  if (page.value > 1) {
    page.value--;
    fetchData();
  }
};

watch([page, pageSize], fetchData, { immediate: true });
</script>
