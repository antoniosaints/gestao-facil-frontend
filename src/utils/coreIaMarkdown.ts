import { renderMarkdownTables } from '@/utils/simpleMarkdown'

export const formatCoreIaMessage = (text: string) => {
  if (!text) return ''

  const escapado = text
    // 1. Escapar HTML perigoso (Segurança)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  let html = renderMarkdownTables(escapado)
    // 2. Blocos de Código (```json ... ```)
    .replace(/```(?:json|javascript|js|bash|typescript)?\n([\s\S]*?)```/g, (_match, code) => {
      return `<pre class="code-block my-3 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto"><code>${code.trim()}</code></pre>`
    })

    // 4. Código Inline (`código`)
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-200 dark:bg-gray-900 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>',
    )

    // 5. Títulos (Headers)
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')

    // 6. Negrito (**texto**)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // 7. Itálico (*texto*)
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

    // 8. Listas (Linhas começando com - ou *)
    .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')

    // 9. Links ([texto](url)) — só http(s) e aspas escapadas. Sem isso, uma URL
    // como `javascript:...` ou contendo `"` permitiria XSS (a IA pode ser
    // induzida por prompt-injection a emitir esse conteúdo).
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match: string, label: string, url: string) => {
      const trimmed = url.trim()
      const safeUrl = /^https?:\/\//i.test(trimmed) ? trimmed.replace(/"/g, '&quot;') : '#'
      return `<a href="${safeUrl}" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">${label}</a>`
    })

    // 10. Citações (> texto)
    .replace(
      /^> (.*$)/gm,
      '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-2">$1</blockquote>',
    )

    // 11. Quebras de linha
    // Ocultamos a quebra se a linha terminar com uma tag de bloco para evitar espaços excessivos
    .replace(/\n/g, (match) => {
      return '<br>'
    })

  return html
}
