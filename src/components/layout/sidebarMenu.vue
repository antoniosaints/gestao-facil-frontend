<template>
    <div>
        <div v-for="(item, index) in menu" :key="index" class="space-y-4">
            <!-- Divisor -->
            <div v-if="item.divisor" class="flex items-center mt-2">
                <div class="flex-grow border-t border-border"></div>
                <span class="mx-4 text-gray-500 dark:text-gray-200 text-xs uppercase">
                    {{ item.nome }}
                </span>
                <div class="flex-grow border-t border-border"></div>
            </div>

            <!-- Dropdown -->
            <div v-else-if="item.children && item.children.length"
                class="mb-1 cursor-pointer dark:bg-background-dark mt-2 rounded-lg border dark:border-border-dark border-border transition-all">
                <button @click="toggleDropdown(item.nome)"
                    class="dropdown-toggle w-full flex items-center hover:bg-gray-200 dark:hover:bg-gray-800 justify-between border-b dark:border-border-dark border-border px-4 py-2 text-left cursor-pointer dark:bg-background-dark rounded-lg transition-colors group">
                    <div class="flex items-center space-x-3">
                        <i :class="[item.icone, item.color ? colorClasses[item.color] : 'text-gray-500']"></i>
                        <span class="font-medium">{{ item.nome }}</span>
                    </div>
                    <svg class="dropdown-arrow w-4 h-4 transition-transform duration-200"
                        :class="{ 'rotate-90': openDropdown === item.nome }" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                <div v-show="openDropdown === item.nome"
                    class="dropdown-content flex flex-col p-1 gap-1 transition-all">
                    <router-link v-for="(child, i) in item.children" :key="i" :to="child.link || 'javascript:void(0)'"
                        :class="[
                            'block p-2 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer dark:bg-background-dark rounded-md transition-colors',
                            route.path === child.link ? 'bg-gray-200 dark:bg-gray-800' : ''
                        ]">
                        <i
                            :class="[child.icone, 'mr-1', child.color ? colorClasses[child.color] : 'text-gray-500']"></i>
                        {{ child.nome }}
                    </router-link>
                </div>
            </div>

            <!-- Link normal -->
            <router-link v-else :to="item.link || 'javascript:void(0)'" :class="[
                'cursor-pointer border border-border mt-2 hover:bg-gray-200 dark:hover:bg-gray-800 dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition flex items-center',
                route.path === item.link ? 'bg-gray-200 dark:bg-gray-800' : ''
            ]">
                <i :class="[item.icone, 'px-2', item.color ? colorClasses[item.color] : 'text-gray-500']"></i>
                {{ item.nome }}
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { SidebarMenuType } from '@/types/sidebar'
import { ref } from 'vue'
import { useRoute } from 'vue-router';

defineProps<{ menu: SidebarMenuType[] }>()
const route = useRoute()

const colorClasses = {
    red: "text-red-500",
    green: "text-green-500",
    blue: "text-blue-500",
    yellow: "text-yellow-500",
    gray: "text-gray-500",
    orange: "text-orange-500",
    indigo: "text-indigo-500",
    purple: "text-purple-500",
    pink: "text-pink-500",
    emerald: "text-emerald-500",
    cyan: "text-cyan-500",
    slate: "text-slate-500",
    violet: "text-violet-500",
};

const openDropdown = ref<string | null>(null)
const toggleDropdown = (id: string) => {
    openDropdown.value = openDropdown.value === id ? null : id
}
</script>
