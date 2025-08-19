<template>
    <div
        class="border border-border dark:border-border-dark cursor-pointer truncate hover:bg-gray-100 dark:hover:bg-gray-800 w-full flex px-3 py-2 justify-between items-center gap-2 rounded-md bg-white dark:bg-gray-900 transition-all">
        <div class="flex gap-2 justify-between items-center" onclick="openModalUploadProfileAccount()">
            <img :src="logoSistemaGestaoFacil" alt="PR" class="rounded-full w-8 h-8 bg-gray-500" />
            <div class="flex flex-col truncate">
                <h1
                    class="text-base overflow-hidden text-ellipsis whitespace-nowrap text-gray-950 truncate dark:text-white">
                    {{ nameSistemaGestaoFacil }}
                </h1>
                <p
                    class="text-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-950 truncate dark:text-gray-200">
                    {{ infoSistemaGestaoFacil }}
                </p>
            </div>
        </div>
        <button style="display: none;" id="unsubscribeBtnHeader"
            class="px-3 py-0.5 rounded-md block md:hidden bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-200 transition-colors"><i
                class="fa-solid fa-bell"></i></button>
        <button style="display: none" id="subscribeBtnHeader"
            class="px-2 py-0.5 rounded-md block md:hidden bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-200 transition-colors"><i
                class="fa-solid fa-bell-slash"></i></button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const logoSistemaGestaoFacil = ref("imgs/logo.png");
const nameSistemaGestaoFacil = ref("Gestão Fácil");
const infoSistemaGestaoFacil = ref("Gestão inteligente");
function atualizarLogoSistema() {
    fetch(`/api/contas/infos`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("gestao_facil:token")}`,
        }
    }).then((response) => response.json()).then((data) => {
        logoSistemaGestaoFacil.value = data.profile + "?_t=" + Date.now();
        nameSistemaGestaoFacil.value = data.nome;
        infoSistemaGestaoFacil.value = data?.Usuarios[0]?.email;
    });
}
</script>