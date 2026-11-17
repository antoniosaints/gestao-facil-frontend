import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'
import { parse as parseTemplate } from '@vue/compiler-dom'

const root = fileURLToPath(new URL('../', import.meta.url))
const fields = []
const inputTags = new Set(['Input', 'input', 'Textarea', 'textarea', 'NumberFieldInput'])
const nativeTypes = new Set([
  'hidden',
  'checkbox',
  'radio',
  'file',
  'submit',
  'button',
  'range',
  'color',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
  'image',
])
function attr(node, name) {
  const attribute = node.props.find((p) => p.type === 6 && p.name === name)
  if (attribute) return attribute.value?.content ?? ''
  const binding = node.props.find(
    (p) => p.type === 7 && p.name === 'bind' && p.arg?.content === name,
  )
  return binding ? ':' + (binding.exp?.content || '') : null
}
function plain(node) {
  if (node.type === 2) return node.content
  if (node.type === 5) return '{{' + node.content.content + '}}'
  return (node.children || []).map(plain).join(' ')
}
function visit(node, parents, content, offset, file) {
  if (node.type === 1) {
    if (
      inputTags.has(node.tag) ||
      ['Select2Ajax', 'DatePicker', 'Calendarpicker'].includes(node.tag)
    ) {
      const model =
        node.props.find((p) => p.type === 7 && p.name === 'model')?.exp?.content ||
        (attr(node, 'model-value') || attr(node, 'modelValue'))?.replace(/^:/, '') ||
        ''
      let label = ''
      for (const parent of [...parents].reverse().slice(0, 3)) {
        const labels = (parent.children || []).filter(
          (child) => child.type === 1 && ['Label', 'label'].includes(child.tag),
        )
        if (labels.length === 1) {
          label = plain(labels[0]).replace(/\s+/g, ' ').trim()
          break
        }
      }
      fields.push({
        file: path.relative(root, file),
        line: content.slice(0, offset + node.loc.start.offset).split('\n').length,
        offset: offset + node.loc.start.offset,
        tag: node.tag,
        model,
        id: attr(node, 'id'),
        name: attr(node, 'name'),
        type: attr(node, 'type') || 'text',
        placeholder: attr(node, 'placeholder'),
        label,
        mask: node.props.find((p) => p.type === 7 && p.name === 'maska')?.exp?.content || null,
        inputmode: attr(node, 'inputmode'),
        step: attr(node, 'step'),
        min: attr(node, 'min'),
        max: attr(node, 'max'),
        binding: node.props.some((p) => p.type === 7 && p.name === 'bind' && !p.arg),
        readonly: ['', ':true', 'true'].includes(attr(node, 'readonly')),
        disabled: ['', ':true', 'true'].includes(attr(node, 'disabled')),
        source: node.loc.source.slice(0, node.loc.source.indexOf('>') + 1),
      })
    }
    for (const child of node.children || []) visit(child, [...parents, node], content, offset, file)
  } else for (const child of node.children || []) visit(child, parents, content, offset, file)
}
function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, callback)
    else callback(file)
  }
}
walk(path.join(root, 'src'), (file) => {
  if (!file.endsWith('.vue')) return
  const content = fs.readFileSync(file, 'utf8')
  const sfc = parse(content, { filename: file }).descriptor
  if (sfc.template)
    visit(parseTemplate(sfc.template.content), [], content, sfc.template.loc.start.offset, file)
})
const textFields = fields.filter((f) => inputTags.has(f.tag) && !nativeTypes.has(f.type))
const isEditableConsumer = (f) =>
  !f.readonly && !f.disabled && !f.file.startsWith('src/components/ui/')
const missing = textFields.filter(
  (f) =>
    isEditableConsumer(f) && (f.placeholder === null || f.placeholder.trim() === '') && !f.binding,
)
function maskKind(field) {
  const identifier = `${field.model} ${field.id || ''} ${field.name || ''}`
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[._?()|-]/g, ' ')
  if (/\b(cep|postal code)\b/i.test(identifier)) return 'cep'
  if (/\b(cpf|cnpj|documento)\b/i.test(identifier)) return 'document'
  if (field.type === 'tel' || /\b(phone|telefone|whatsapp|whastapp|celular)\b/i.test(identifier)) {
    // Message templates and scheduling settings contain "whatsapp" in their object name.
    if (/template|mensagem|horas/i.test(field.model) || field.type === 'number') return null
    return 'phone'
  }
  return null
}
const personal = textFields.filter((f) => maskKind(f))
const unmasked = personal.filter((f) => isEditableConsumer(f) && !f.mask)

// Supported server-rendered forms are audited too; deprecated templates are excluded.
const legacy = []
walk(path.join(root, '../api/views'), (file) => {
  if (!/\.(hbs|html)$/.test(file) || file.split(path.sep).includes('deprecated')) return
  const content = fs.readFileSync(file, 'utf8')
  for (const match of content.matchAll(/<(input|textarea)\b[^>]*>/gi)) {
    const source = match[0]
    const read = (name) => source.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? null
    const type = read('type') || 'text'
    if (nativeTypes.has(type)) continue
    legacy.push({
      file: path.relative(path.join(root, '..'), file),
      line: content.slice(0, match.index).split('\n').length,
      type,
      id: read('id'),
      name: read('name'),
      placeholder: read('placeholder'),
      mask: read('data-input-mask'),
      source,
      // Existing signup template already applies its own phone and CPF/CNPJ masks.
      existingMask: file.endsWith('/site/cadastro.hbs') && ['phone', 'cnpj'].includes(read('id')),
    })
  }
})
const legacyMissing = legacy.filter(
  (f) =>
    (f.placeholder === null || f.placeholder.trim() === '') &&
    !/\b(readonly|disabled)\b/.test(f.source),
)
const legacyUnmasked = legacy.filter(
  (f) => /\b(telefone|whastapp|documento|cep)\b/i.test(f.name || '') && !f.mask && !f.existingMask,
)
const report = {
  summary: {
    allFields: fields.length,
    textFields: textFields.length,
    missingPlaceholders: missing.length,
    personalFields: personal.length,
    unmaskedPersonal: unmasked.length,
    legacyFields: legacy.length,
    legacyMissingPlaceholders: legacyMissing.length,
    legacyUnmaskedPersonal: legacyUnmasked.length,
  },
  fields,
  missingPlaceholders: missing,
  personalFields: personal,
  unmaskedPersonal: unmasked,
  legacyFields: legacy,
  legacyMissingPlaceholders: legacyMissing,
  legacyUnmaskedPersonal: legacyUnmasked,
  exclusions: [
    'Native date/time/color/file/range/hidden and choice controls',
    'Read-only/disabled displays',
    'UI primitives forward consumer attributes; Calendarpicker supplies its default placeholder',
    'PIX keys and searches accept mixed formats; address numbers allow S/N and letters',
    'Native numeric inputs retain number semantics, step and precision rather than text formatting',
    'Deprecated server-rendered templates',
  ],
}
const output = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report.summary))
if (
  process.argv.includes('--check') &&
  (missing.length || unmasked.length || legacyMissing.length || legacyUnmasked.length)
) {
  for (const field of [...missing, ...unmasked, ...legacyMissing, ...legacyUnmasked])
    console.error(`${field.file}:${field.line} ${field.model || field.id || field.name}`)
  process.exitCode = 1
}
