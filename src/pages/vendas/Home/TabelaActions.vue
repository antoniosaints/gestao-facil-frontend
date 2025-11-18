<script setup lang="ts">
import { Menu, Printer } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Vendas } from '@/types/schemas';
import type { Table } from '@tanstack/vue-table';
import { deletarVenda, editarVenda, estornarVenda, gerarCupomVenda, openModalFaturarVenda } from '../ActionsVendas';
import { VendaRepository } from '@/repositories/venda-repository';
const { data } = defineProps<{
    data: Vendas,
    table: Table<Vendas>
}>()

async function printCupom(id: number) {
    try {
        await VendaRepository.printCupom(id)
    } catch (error) {
        console.log(error)
    }
}
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
                <DropdownMenuItem v-if="data.status !== 'FATURADO'" @click="editarVenda(data.id!)">
                    <i class="fa-regular fa-pen-to-square mr-1"></i>
                    Editar
                </DropdownMenuItem>
                <DropdownMenuItem @click="gerarCupomVenda(data.id!)">
                    <i class="fa-regular fa-file-pdf mr-1"></i>
                    Cupom PDF
                </DropdownMenuItem>
                <DropdownMenuItem @click="printCupom(data.id!)">
                    <Printer />
                    Imprimir
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
                    @click="deletarVenda(data.id!)">
                    <i class="fa-regular fa-trash-can mr-1"></i>
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>