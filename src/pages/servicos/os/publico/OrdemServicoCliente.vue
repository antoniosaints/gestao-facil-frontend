<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-800 to-blue-900 p-0 md:p-6">
        <div class="max-w-3xl mx-auto">
            <Card v-if="show" class="shadow-2xl rounded-none rounded-b-xl border-0 overflow-hidden">
                <CardHeader class="bg-gradient-to-br from-blue-900 to-blue-800 p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <CardTitle class="text-3xl mb-2">#{{ ordemServico?.Uid }}</CardTitle>
                            <CardDescription class="text-blue-100 text-base">Assinatura pública da OS</CardDescription>
                        </div>
                        <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <span class="text-sm">Status</span>
                            <p class="text-xs mt-1">Aguardando assinatura</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent class="p-4 space-y-4 bg-white">
                    <!-- Dados básicos -->
                    <div class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-md border border-gray-200">
                        <h2 class=" text-xl text-gray-800 mb-4 flex items-center">
                            <span class="w-2 h-8 bg-gray-600 rounded-full mr-3"></span>
                            Dados da OS
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div class="bg-white px-4 py-2 rounded-lg shadow-sm">
                                <p class="text-sm text-gray-500 mb-1">Cliente</p>
                                <p class="text-gray-800">{{ ordemServico?.Cliente.nome }}</p>
                            </div>
                            <div class="bg-white px-4 py-2 rounded-lg shadow-sm">
                                <p class="text-sm text-gray-500 mb-1">Garantia</p>
                                <p class="text-gray-800">{{ ordemServico?.garantia }} dias</p>
                            </div>
                            <div class="bg-white px-4 py-2 rounded-lg shadow-sm">
                                <p class="text-sm text-gray-500 mb-1">Status</p>
                                <p class="text-amber-600">Aguardando assinatura</p>
                            </div>
                            <div class="bg-white px-4 py-2 rounded-lg shadow-sm md:col-span-3">
                                <p class="text-sm text-gray-500 mb-1">Descrição</p>
                                <p class="text-gray-800">{{ ordemServico?.descricao || 'Sem descrição' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Serviços -->
                    <div v-show="ordemServico?.ItensOrdensServico.filter(p => p.tipo === 'SERVICO').length"
                        class="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <h2 class=" text-xl text-gray-800 mb-4 flex items-center">
                            <span class="w-2 h-8 bg-purple-600 rounded-full mr-3"></span>
                            Serviços
                        </h2>
                        <ul class="space-y-2">
                            <li v-for="row in ordemServico?.ItensOrdensServico.filter(p => p.tipo === 'SERVICO')"
                                :key="row.id!"
                                class="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <span class="text-gray-700">{{ row.itemName }}</span>
                                <span class=" text-blue-600">
                                    {{ formatCurrencyBR(Number(row.valor) * row.quantidade) }}
                                </span>
                            </li>
                        </ul>
                    </div>

                    <!-- Produtos -->
                    <div class="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <h2 class=" text-xl text-gray-800 mb-4 flex items-center">
                            <span class="w-2 h-8 bg-blue-600 rounded-full mr-3"></span>
                            Produtos
                        </h2>
                        <ul class="space-y-2">
                            <li v-for="row in ordemServico?.ItensOrdensServico.filter(p => p.tipo === 'PRODUTO')"
                                :key="row.id!"
                                class="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <span class="text-gray-700">{{ row.itemName }}</span>
                                <span class=" text-blue-600">
                                    {{ formatCurrencyBR(Number(row.valor) * row.quantidade) }}
                                </span>
                            </li>
                        </ul>
                    </div>

                    <!-- Totais -->
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-md border-2 border-green-200">
                        <h2 class=" text-xl text-gray-800 mb-4 flex items-center">
                            <span class="w-2 h-8 bg-green-600 rounded-full mr-3"></span>
                            Resumo Financeiro
                        </h2>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center text-gray-700">
                                <span>Subtotal</span>
                                <span class="">{{ formatCurrencyBR(subtotalOrdem) }}</span>
                            </div>
                            <div class="flex justify-between items-center text-green-600">
                                <span>Desconto</span>
                                <span class="">
                                    - {{ formatCurrencyBR(ordemServico?.desconto!) }}
                                </span>
                            </div>
                            <div class="border-t-2 border-green-300 pt-3 mt-3"></div>
                            <div class="flex justify-between items-center text-2xl  text-gray-900">
                                <span>Total</span>
                                <span class="text-green-600">
                                    {{ formatCurrencyBR(subtotalOrdem - Number(ordemServico?.desconto)) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Assinatura -->
                    <div class="bg-amber-50 p-4 rounded-md border-2 border-amber-200">
                        <h2 class=" text-xl text-gray-800 mb-4 flex items-center">
                            <span class="w-2 h-8 bg-amber-600 rounded-full mr-3"></span>
                            Assinatura do Cliente
                        </h2>
                        <div class="bg-white p-4 rounded-lg shadow-inner">
                            <canvas ref="signaturePad" width="600" height="200"
                                class="border-2 border-dashed border-gray-300 rounded-lg w-full h-40 bg-white hover:border-amber-400 transition-colors"></canvas>
                            <div class="flex gap-2 mt-4">
                                <Button class="bg-red-500 hover:bg-red-600 text-white" @click="clearSignature">
                                    <Trash class="w-6 h-6 inline-flex" /> Limpar
                                </Button>
                                <Button class="bg-primary text-white" @click="baixarAssinatura" :disabled="!signed">
                                    <ImageDown class="w-6 h-6 inline-flex" />
                                    Baixar
                                    Assinatura
                                </Button>
                            </div>
                        </div>
                    </div>

                    <!-- Botões -->
                    <div class="flex gap-4 mt-8">
                        <Button @click="saveSignature" :disabled="signed"
                            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white py-6 text-lg rounded-md shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <Signature class="w-8 h-8 inline-flex" /> Assinar
                        </Button>
                        <Button variant="secondary" :disabled="!signed" @click="showPaymentModal = true"
                            class="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white  py-6 text-lg rounded-md shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <CreditCard class="w-8 h-8 inline-flex" /> Pagar
                        </Button>
                    </div>

                    <!-- Modal Pagamento -->
                    <Dialog v-model:open="showPaymentModal">
                        <DialogContent class="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle class="text-2xl  text-center mb-2">💰 Escolha a forma de pagamento
                                </DialogTitle>
                            </DialogHeader>
                            <div class="space-y-4 mt-4">
                                <Button
                                    class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white  py-6 text-lg rounded-md shadow-lg hover:shadow-xl transition-all">
                                    📱 Pagar com Pix
                                </Button>
                                <Button
                                    class="w-full bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white  py-6 text-lg rounded-md shadow-lg hover:shadow-xl transition-all"
                                    variant="secondary">
                                    🧾 Gerar Boleto
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
            <Card v-show="loading || !show" class="shadow-2xl border-0 overflow-hidden">
                <CardHeader class="bg-gradient-to-br from-blue-900 to-blue-800 p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <CardTitle class="text-3xl mb-2">Assinatura digital</CardTitle>
                            <CardDescription class="text-blue-100 text-base">Aguardando carregamento das informações...
                            </CardDescription>
                        </div>
                        <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <span class="text-sm">Em análise</span>
                            <p class="text-xs mt-1">Lendo informações</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent class="p-4 space-y-4 bg-white">
                    <Empty class="border border-dashed">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Cloud />
                            </EmptyMedia>
                            <EmptyTitle>Nada para assinar aqui.</EmptyTitle>
                            <EmptyDescription>
                                Você pode verificar com o emissor da OS, peça o link novamente ou tente recarregar a
                                página.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button @click="reloadPage" variant="outline" size="sm">
                                Recarregar a página.
                            </Button>
                        </EmptyContent>
                    </Empty>
                </CardContent>
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from "vue";
import { OrdensServicoRepository } from "@/repositories/os-repository";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { HashGenerator } from "@/utils/generators";
import type { IDetalheOrdemServico } from "@/types/schemas";
import { formatCurrencyBR } from "@/utils/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Cloud, CreditCard, ImageDown, Signature, Trash } from "lucide-vue-next";

const route = useRoute();
const toast = useToast();

const signaturePad = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let drawing = false;
const signed = ref(false);
const assinaturaBase64 = ref<string | null>(null);
const showPaymentModal = ref(false);
const ordemServico = ref<IDetalheOrdemServico | null>(null);
const ordemId = ref(route.params.ordemId);
const contaId = ref(route.params.contaId);
const loading = ref(true);
const show = ref(true);

const subtotalOrdem = computed(() => {
    if (!ordemServico.value) return 0;
    return ordemServico.value.ItensOrdensServico.reduce(
        (acc, item) => acc + item.valor * item.quantidade,
        0
    );
});

function reloadPage() {
    window.location.reload();
}

const getOrdemServico = async () => {
    try {
        const conta = HashGenerator.decode(String(contaId.value))[0];
        const ordem = HashGenerator.decode(String(ordemId.value))[0];
        if (isNaN(Number(conta))) {
            show.value = false;
            return toast.error("Dados não encontrados")
        };
        if (isNaN(Number(ordem))) {
            show.value = false;
            return toast.error("Dados não encontrados")
        };
        const id = HashGenerator.decode(String(ordemId.value))[0];
        const response = await OrdensServicoRepository.getDetalhes(Number(id));
        ordemServico.value = response;
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
};

function getPosFromEvent(e: PointerEvent) {
    const canvas = signaturePad.value!;
    const rect = canvas.getBoundingClientRect();
    // Use CSS pixels because ctx was scaled for DPR
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
}

function start(e: PointerEvent) {
    if (!ctx || !signaturePad.value) return;
    // se já assinou, não permite desenhar
    if (signed.value) return;
    drawing = true;
    signaturePad.value.setPointerCapture(e.pointerId);
    const { x, y } = getPosFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e: PointerEvent) {
    if (!drawing || !ctx) return;
    e.preventDefault();
    const { x, y } = getPosFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stop(e?: PointerEvent) {
    if (!signaturePad.value) return;
    drawing = false;
    try {
        if (e && (e as PointerEvent).pointerId != null) {
            signaturePad.value.releasePointerCapture((e as PointerEvent).pointerId);
        }
    } catch (err) {
        // ignore
    }
}

function clearSignature() {
    if (!ctx || !signaturePad.value) return;
    ctx.clearRect(0, 0, signaturePad.value.width, signaturePad.value.height);
    signed.value = false;
}

function saveSignature() {
    if (!signaturePad.value) return;
    const dataURL = signaturePad.value.toDataURL("image/png");
    assinaturaBase64.value = dataURL;
    drawing = false;
    signed.value = true;
}

function base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
}

function baixarAssinatura() {
    if (!assinaturaBase64.value) return;
    const a = document.createElement("a");
    a.href = assinaturaBase64.value;
    a.download = "assinatura.png";
    a.click();
}

async function enviarAssinatura() {
    if (!assinaturaBase64.value) return;
    const file = base64ToFile(assinaturaBase64.value, "assinatura.png");
    const form = new FormData();
    form.append("assinatura", file);
    // enviar para sua API aqui
}

// Setup do canvas (espera o DOM e ajusta DPR)
onMounted(async () => {
    await nextTick();
    const canvas = signaturePad.value;
    if (!canvas) {
        console.error("Canvas não encontrado (ref não vinculada). Confira o template: <canvas ref=\"signaturePad\">");
        return;
    }

    // Ajuste de resolução para ficar nítido em telas HiDPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Não foi possível obter 2D context do canvas");
        return;
    }

    // Escala o contexto para considerar o DPR (usaremos coordenadas em CSS pixels)
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    // Usar pointer events unifica touch e mouse
    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointerleave", stop);

    // Opcional: carregar ordem ao montar
    getOrdemServico();
});
</script>


<style scoped>
canvas {
    touch-action: none;
}
</style>