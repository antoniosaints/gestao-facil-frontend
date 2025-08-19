<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-center px-6">
    <h1 class="text-9xl font-extrabold text-gray-800 dark:text-gray-200">404</h1>
    <p class="text-2xl md:text-3xl font-semibold mt-4 text-gray-600 dark:text-gray-400">
      Página não encontrada
    </p>
    <p class="mt-2 text-gray-500 dark:text-gray-400">
      Desculpe, não conseguimos encontrar a página que você procura.
    </p>
    <router-link to="/"
      class="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-2xl shadow hover:bg-blue-700 transition">
      Voltar para Home
    </router-link>
  </div>
</template>

<script setup>
// Não precisa de lógica especial, apenas exibe a página
</script>
