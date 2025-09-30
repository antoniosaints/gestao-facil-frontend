<script setup lang="ts">
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

// segmentos reativos
const segments = computed(() => route.path.split('/').filter(Boolean))

// monta o caminho acumulado para cada nível
const buildPath = (index: number) => {
    return '/' + segments.value.slice(0, index + 1).join('/')
}

// capitaliza primeira letra
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
</script>

<template>
    <Breadcrumb>
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink as-child>
                    <RouterLink :class="segments.length === 0 ? 'text-foreground' : 'text-muted-foreground'" to="/">
                        Home
                    </RouterLink>
                </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator v-if="segments.length > 0" />

            <template v-for="(segment, index) in segments" :key="index">
                <BreadcrumbItem>
                    <BreadcrumbLink as-child>
                        <RouterLink :to="buildPath(index)"
                            :class="index === segments.length - 1 ? 'text-foreground' : 'text-muted-foreground'">
                            {{ route.matched[index + 1]?.meta?.title || capitalize(segment) }}
                        </RouterLink>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator v-if="index !== segments.length - 1" />
            </template>
        </BreadcrumbList>
    </Breadcrumb>
</template>
