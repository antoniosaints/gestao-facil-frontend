<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="bg-white shadow-lg rounded-2xl w-80">
            <!-- Display -->
            <div class="p-4 text-right text-3xl font-semibold bg-gray-200 rounded-t-2xl">
                {{ display || '0' }}
            </div>

            <!-- Histórico -->
            <div v-if="history.length" class="p-2 text-xs text-gray-500 border-b bg-gray-50 max-h-20 overflow-y-auto">
                <div v-for="(item, index) in history.slice(-5)" :key="index">
                    {{ item }}
                </div>
            </div>

            <!-- Botões principais -->
            <div class="grid grid-cols-4 gap-2 p-3">
                <button v-for="btn in buttons" :key="btn" @click="press(btn)" class="p-3 text-lg font-semibold rounded-xl shadow-sm transition 
                 hover:bg-gray-300 active:scale-95" :class="{
                    'bg-gray-100': !isOperator(btn),
                    'bg-blue-500 text-white': isOperator(btn),
                    'col-span-2': btn === '0'
                }">
                    {{ btn }}
                </button>
            </div>

            <!-- Modo avançado -->
            <div v-if="advancedMode" class="grid grid-cols-3 gap-2 p-3 border-t">
                <button v-for="btn in advancedButtons" :key="btn" @click="pressAdvanced(btn)" class="p-3 text-sm font-semibold rounded-xl shadow-sm transition 
                 bg-purple-500 text-white hover:bg-purple-600 active:scale-95">
                    {{ btn }}
                </button>
            </div>

            <!-- Alternar modo -->
            <div class="p-3 flex justify-between items-center border-t bg-gray-50 rounded-b-2xl">
                <span class="text-sm text-gray-500">Modo Avançado</span>
                <label class="inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="advancedMode" class="sr-only peer" />
                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 
                   peer-focus:ring-blue-300 rounded-full peer 
                   peer-checked:after:translate-x-full peer-checked:after:border-white 
                   after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                   after:bg-white after:border-gray-300 after:border after:rounded-full 
                   after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 relative"></div>
                </label>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"

const display = ref < string > ('')
const history = ref([])
const advancedMode = ref(false)

const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
    'C'
]

const advancedButtons = ['sin', 'cos', 'tan', '√', '^', 'π']

function isOperator(value) {
    return ['/', '*', '-', '+', '='].includes(value)
}

function press(value) {
    if (value === 'C') {
        display.value = ''
        return
    }

    if (value === '=') {
        try {
            const result = eval(display.value)
            history.value.push(`${display.value} = ${result}`)
            display.value = result.toString()
        } catch {
            display.value = 'Erro'
        }
        return
    }

    display.value += value
}

function pressAdvanced(value) {
    try {
        let result
        const expr = display.value || '0'
        switch (value) {
            case 'sin': result = Math.sin(eval(expr)); break
            case 'cos': result = Math.cos(eval(expr)); break
            case 'tan': result = Math.tan(eval(expr)); break
            case '√': result = Math.sqrt(eval(expr)); break
            case '^': display.value += '**'; return
            case 'π': display.value += Math.PI; return
        }
        history.value.push(`${value}(${expr}) = ${result}`)
        display.value = result.toString()
    } catch {
        display.value = 'Erro'
    }
}

// Teclado físico
function handleKey(e) {
    const key = e.key
    if (/^[0-9+\-*/.=]$/.test(key)) {
        press(key === 'Enter' ? '=' : key)
    } else if (key === 'Enter') {
        press('=')
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        press('C')
    }
}

onMounted(() => window.addEventListener('keydown', handleKey))
onUnmounted(() => window.removeEventListener('keydown', handleKey))
</script>

<style>
body {
    font-family: 'Inter', sans-serif;
}
</style>
