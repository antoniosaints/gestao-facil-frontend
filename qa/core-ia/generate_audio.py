"""Synthetic pt-BR fixtures; uses the eSpeak NG library already installed on the QA host."""
from pathlib import Path
import ctypes as c
import subprocess
import wave

out = Path(__file__).resolve().parents[3] / 'output' / 'core-ia' / 'ui-audio'
out.mkdir(parents=True, exist_ok=True)
lib = c.CDLL('libespeak-ng.so.1')
lib.espeak_Initialize.argtypes = [c.c_int, c.c_int, c.c_char_p, c.c_int]
lib.espeak_SetVoiceByName.argtypes = [c.c_char_p]
lib.espeak_Synth.argtypes = [c.c_void_p, c.c_size_t, c.c_uint, c.c_int, c.c_uint, c.c_uint, c.POINTER(c.c_uint), c.c_void_p]
rate = lib.espeak_Initialize(2, 0, None, 0)
assert rate > 0
assert lib.espeak_SetVoiceByName(b'pt-br') == 0
lib.espeak_SetParameter(1, 155, 0)
chunks = []
@c.CFUNCTYPE(c.c_int, c.POINTER(c.c_short), c.c_int, c.c_void_p)
def callback(samples, count, _events):
    if samples and count: chunks.append(c.string_at(samples, count * 2))
    return 0
lib.espeak_SetSynthCallback(callback)
for mode, label in [('chat', 'Chat'), ('widget', 'Balão')]:
    requests = {
        'cliente': f'Cadastre um cliente chamado Aurora {label}.',
        'produto': f'Cadastre um produto chamado Caneca {label}, preço dez reais, estoque inicial cinco unidades, estoque mínimo zero.',
        'servico': f'Cadastre um serviço chamado Instalação {label}, com preço de vinte reais.',
        'lancamento': f'Registre uma despesa chamada Despesa {label}, no valor de cinco reais e cinquenta centavos, na conta Caixa QA, categoria QA, pagamento em dinheiro. Ainda não está paga.',
        'venda': f'Registre uma venda para a cliente Aurora {label}, com duas unidades de Caneca {label} e uma unidade de Instalação {label}. Use os preços do catálogo, sem desconto. Forma de pagamento outro, ainda não recebido.',
    }
    for kind, text in requests.items():
        chunks.clear()
        encoded = text.encode('utf-8') + b'\0'
        assert lib.espeak_Synth(encoded, len(encoded), 0, 1, 0, 1, None, None) == 0
        target = out / f'{mode}-{kind}.wav'
        with wave.open(str(target), 'wb') as stream:
            stream.setnchannels(1); stream.setsampwidth(2); stream.setframerate(rate); stream.writeframes(b''.join(chunks))
        if mode == 'widget':
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i',str(target),'-codec:a','libmp3lame','-b:a','64k','-y',str(target.with_suffix('.mp3'))],check=True)
print('10 áudios sintéticos pt-BR gerados, com versões MP3 para o balão.')
