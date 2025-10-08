<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Vendas } from '@/types/schemas';
import type { Table } from '@tanstack/vue-table';
import { editarVenda, estornarVenda, gerarCupomVenda, openModalDeleteVenda, openModalFaturarVenda } from '../ActionsVendas';
import { useVendasStore } from '@/stores/vendas/useVenda';
const { data } = defineProps<{
    data: Vendas,
    table: Table<Vendas>
}>()

const store = useVendasStore()
</script>

<template>
    <div>
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <Button variant="default" class="w-8 h-8 p-0 text-white">
                    <span class="sr-only">Abrir opções</span>
                    <Menu class="w-4 h-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem @click="store.openDetalhes(data.id!)">
                    <i class="fa-regular fa-eye mr-1"></i>
                    Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem v-if="data.status !== 'FATURADO'" @click="editarVenda(data.id!)">
                    <i class="fa-regular fa-pen-to-square mr-1"></i>
                    Editar
                </DropdownMenuItem>
                <DropdownMenuItem @click="gerarCupomVenda(data.id!)">
                    <i class="fa-regular fa-file-pdf mr-1"></i>
                    Cupom PDF
                </DropdownMenuItem>
                <DropdownMenuItem @click="openModalFaturarVenda(data.id!)" v-if="data.status !== 'FATURADO'">
                    <i class="fa-solid fa-dollar-sign mr-1"></i>
                    Faturar
                </DropdownMenuItem>
                <DropdownMenuItem @click="estornarVenda(data.id!)" v-if="data.status === 'FATURADO'">
                    <i class="fa-regular fa-square-minus mr-1"></i>
                    Estornar
                </DropdownMenuItem>
                <DropdownMenuSeparator v-if="data.status !== 'FATURADO'" />
                <DropdownMenuItem v-if="data.status !== 'FATURADO'" class="text-red-500"
                    @click="openModalDeleteVenda(data.id!)">
                    <i class="fa-regular fa-trash-can mr-1"></i>
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>