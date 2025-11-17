<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-800 via-blue-900 to-blue-800 p-0 md:p-6">
        <div class="max-w-3xl mx-auto">
            <Card class="shadow-2xl border-0 overflow-hidden">
                <CardHeader class="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <CardTitle class="text-3xl mb-2">Ordem de Serviço #12345</CardTitle>
                            <CardDescription class="text-blue-100 text-base">Consulta pública da OS</CardDescription>
                        </div>
                        <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                            <span class="text-sm font-semibold">Status</span>
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
                                <p class="font-semibold text-gray-800">João da Silva</p>
                            </div>
                            <div class="bg-white px-4 py-2 rounded-lg shadow-sm">
                                <p class="text-sm text-gray-500 mb-1">Garantia</p>
                                <p class="font-semibold text-gray-800">90 dias</p>
                            </div>
                            <div class="bg-white px-4 py-2 rounded-lg shadow-sm">
                                <p class="text-sm text-gray-500 mb-1">Status</p>
                                <p class="font-semibold text-amber-600">Aguardando assinatura</p>
                            </div>
                            <div class="bg-white px-4 py-2 rounded-lg shadow-sm md:col-span-3">
                                <p class="text-sm text-gray-500 mb-1">Descrição</p>
                                <p class="font-semibold text-gray-800">Manutenção eletrica</p>
                            </div>
                        </div>
                    </div>

                    <!-- Serviços -->
                    <div class="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <h2 class=" text-xl text-gray-800 mb-4 flex items-center">
                            <span class="w-2 h-8 bg-purple-600 rounded-full mr-3"></span>
                            Serviços
                        </h2>
                        <ul class="space-y-2">
                            <li
                                class="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <span class="text-gray-700">Manutenção elétrica</span>
                                <span class=" text-blue-600">R$ 150,00</span>
                            </li>
                            <li
                                class="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <span class="text-gray-700">Instalação do módulo</span>
                                <span class=" text-blue-600">R$ 80,00</span>
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
                            <li
                                class="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <span class="text-gray-700">Sensor X</span>
                                <span class=" text-blue-600">R$ 120,00</span>
                            </li>
                            <li
                                class="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <span class="text-gray-700">Cabo reforçado</span>
                                <span class=" text-blue-600">R$ 35,00</span>
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
                                <span class="font-semibold">R$ 385,00</span>
                            </div>
                            <div class="flex justify-between items-center text-green-600">
                                <span>Desconto</span>
                                <span class="font-semibold">- R$ 20,00</span>
                            </div>
                            <div class="border-t-2 border-green-300 pt-3 mt-3"></div>
                            <div class="flex justify-between items-center text-2xl  text-gray-900">
                                <span>Total</span>
                                <span class="text-green-600">R$ 365,00</span>
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
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, ImageDown, Signature, Trash } from "lucide-vue-next";
import { OrdensServicoRepository } from "@/repositories/os-repository";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import { HashGenerator } from "@/utils/generators";

const route = useRoute();
const toast = useToast();
let signaturePad = ref(null);
let ctx = null;
let drawing = false;
const signed = ref(false);
const assinaturaBase64 = ref(null); (false);
const showPaymentModal = ref(false);
const ordemServico = ref(null);
const ordemId = ref(route.params.ordemId);
const contaId = ref(route.params.contaId);

const getOrdemServico = async () => {
    try {
        if (isNaN(HashGenerator.decode(String(contaId.value))[0])) return toast.error("Conta não encontrada");
        if (isNaN(HashGenerator.decode(String(ordemId.value))[1])) return toast.error("Ordem de Serviço não encontrada");
        const id = HashGenerator.decode(String(ordemId.value))[0];
        const response = await OrdensServicoRepository.get(Number(id));
        ordemServico.value = response;
    } catch (error) {
        console.log(error);
    }
}

onMounted(() => {
    const canvas = signaturePad.value;
    ctx = canvas.getContext("2d");

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stop);

    getOrdemServico();
});

function getPos(e) {
    const rect = signaturePad.value.getBoundingClientRect();
    const scaleX = signaturePad.value.width / rect.width;
    const scaleY = signaturePad.value.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
}

function start(e) {
    drawing = true;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!drawing) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stop() {
    drawing = false;
}
function clearSignature() {
    ctx.clearRect(0, 0, signaturePad.value.width, signaturePad.value.height);
    signed.value = false;
    signaturePad.value.style.pointerEvents = "auto";
}

function saveSignature() {
    const dataURL = signaturePad.value.toDataURL("image/png");
    assinaturaBase64.value = dataURL;
    drawing = false;
    signed.value = true;
    signaturePad.value.style.pointerEvents = "none";
}
function base64ToFile(base64, filename) {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
}

function baixarAssinatura() {
    if (!assinaturaBase64.value) return;

    const a = document.createElement("a");
    a.href = assinaturaBase64.value; // dataURL
    a.download = "assinatura.png";
    a.click();
}


async function enviarAssinatura() {
    const file = base64ToFile(assinaturaBase64.value, "assinatura.png");
    const form = new FormData();
    form.append("os_id", 12345);
    form.append("assinatura", file);
    await axios.post("/api/os/assinatura", form, {
        headers: { "Content-Type": "multipart/form-data" },
    });
}
</script>

<style scoped>
canvas {
    touch-action: none;
}
</style>