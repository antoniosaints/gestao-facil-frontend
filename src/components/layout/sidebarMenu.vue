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
                class="mb-1 cursor-pointer mt-2 rounded-xl border border-border/70 transition-all">
                <button @click="toggleDropdown(item.nome)"
                    class="dropdown-toggle w-full flex items-center bg-background hover:bg-gray-200 dark:hover:bg-gray-800 justify-between px-4 py-2 text-left cursor-pointer rounded-xl transition-colors group">
                    <div class="flex items-center space-x-3">
                        <i v-if="typeof item.icone === 'string'"
                            :class="[item.icone, 'text-blue-800 dark:text-blue-400']"></i>
                        <component v-else :is="item.icone" :class="['w-5 h-5', 'text-blue-800 dark:text-blue-400']">
                        </component>
                        <span class="text-gray-700 dark:text-gray-300">{{ item.nome }}</span>
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
                            'flex items-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 pl-4 dark:hover:bg-gray-800 cursor-pointer rounded-xl transition-colors',
                            route.path === child.link && 'bg-gray-200 dark:bg-gray-800'
                        ]">
                        <i v-if="typeof child.icone === 'string'"
                            :class="[child.icone, 'mr-2', 'text-blue-600 dark:text-blue-600']"></i>
                        <component v-else :is="child.icone"
                            :class="['mr-2 w-5 h-5', 'text-blue-600 dark:text-blue-600']">
                        </component>
                        <span class="truncate">
                            {{ child.nome }}
                        </span>
                    </router-link>
                </div>
            </div>

            <!-- Link normal -->
            <router-link v-else :to="item.link || 'javascript:void(0)'" :class="[
                'cursor-pointer border bg-background border-border/70 mt-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 p-2 rounded-xl transition flex items-center',
                route.path === item.link && 'bg-gray-200 dark:bg-gray-800'
            ]">
                <i v-if="typeof item.icone === 'string'"
                    :class="[item.icone, 'px-2', 'text-blue-800 dark:text-blue-400']"></i>
                <component v-else :is="item.icone" :class="['ml-2 mr-3 w-5 h-5', 'text-blue-800 dark:text-blue-400']">
                </component>
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
