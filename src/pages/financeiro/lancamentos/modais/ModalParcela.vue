<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue';
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { moneyMaskOptions } from '@/lib/imaska';
import { vMaska } from 'maska/vue';

</script>

<template>
    <ModalView size="sm" title="Formulario de parcela" description="Preencha os campos abaixo">
        <form class="grid grid-cols-1 gap-2">
            <div>
                <Label>Vencimento</Label>
                <Calendarpicker />
            </div>
            <div>
                <Label>Valor</Label>
                <Input type="text" placeholder="R$ 0,00" v-maska="moneyMaskOptions" />
            </div>
            <div>
                <Button variant="default" class="text-white">Registrar</Button>
            </div>
        </form>
    </ModalView>
</template>