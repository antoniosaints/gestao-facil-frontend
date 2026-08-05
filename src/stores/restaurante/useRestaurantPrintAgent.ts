import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import type { Socket } from 'socket.io-client'
import { getSocket } from '@/pluguins/socket'
import { RestauranteRepository } from '@/repositories/restaurante-repository'
import qzTray, { type PaperSize } from '@/utils/qzTray'

export const RESTAURANT_PRINT_STORAGE = {
  connectors: 'restaurante:qz:connectors',
  token: 'restaurante:qz:station-token',
  printer: 'restaurante:qz:printer',
  paper: 'restaurante:qz:paper',
  enabled: 'restaurante:qz:enabled',
  printedJobs: 'restaurante:qz:printed-jobs',
} as const

export interface RestaurantLocalPrintConnector {
  localId: string
  stationId?: number
  stationName?: string
  token: string
  printer: string
  paper: '58mm' | '80mm'
  enabled: boolean
  lastActivityAt?: string | null
  lastError?: string | null
  lastPrintedJobUid?: string | null
}

export interface RestaurantLocalPrintConnectorInput {
  token: string
  printer: string
  paper: '58mm' | '80mm'
  enabled: boolean
}

function localId() {
  return `qz-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function readConnectors(): RestaurantLocalPrintConnector[] {
  try {
    const saved = JSON.parse(localStorage.getItem(RESTAURANT_PRINT_STORAGE.connectors) || '[]')
    if (Array.isArray(saved) && saved.length) {
      return saved
        .filter((item) => item?.localId && item?.token && item?.printer)
        .map((item) => ({
          ...item,
          paper: item.paper === '58mm' ? '58mm' : '80mm',
          enabled: Boolean(item.enabled),
          lastError: null,
        }))
    }
  } catch { /* A configuração legada será tentada abaixo. */ }

  const token = localStorage.getItem(RESTAURANT_PRINT_STORAGE.token)?.trim() || ''
  const printer = localStorage.getItem(RESTAURANT_PRINT_STORAGE.printer) || ''
  if (!token || !printer) return []

  const migrated: RestaurantLocalPrintConnector[] = [{
    localId: localId(),
    token,
    printer,
    paper: localStorage.getItem(RESTAURANT_PRINT_STORAGE.paper) === '58mm' ? '58mm' : '80mm',
    enabled: localStorage.getItem(RESTAURANT_PRINT_STORAGE.enabled) === 'true',
    lastActivityAt: null,
    lastError: null,
  }]
  localStorage.setItem(RESTAURANT_PRINT_STORAGE.connectors, JSON.stringify(migrated))
  return migrated
}

export const useRestaurantPrintAgent = defineStore('restaurantPrintAgent', () => {
  const toast = useToast()
  const connectors = ref<RestaurantLocalPrintConnector[]>(readConnectors())
  const printers = ref<string[]>([])
  const qzConnected = ref(qzTray.isConnected())
  const processingConnectorIds = ref<string[]>([])
  const started = ref(false)
  let pollingTimer: ReturnType<typeof setInterval> | null = null
  let socket: Socket | null = null

  const enabledConnectors = computed(() => connectors.value.filter(
    (item) => item.enabled && item.token.trim() && item.printer,
  ))
  const configured = computed(() => connectors.value.length > 0)
  const serviceEnabled = computed(() => enabledConnectors.value.length > 0)
  const localReady = computed(() => qzConnected.value && enabledConnectors.value.length > 0)
  const processing = computed(() => processingConnectorIds.value.length > 0)
  const lastError = computed(() => connectors.value.find((item) => item.lastError)?.lastError || null)
  const lastActivityAt = computed(() => connectors.value
    .map((item) => item.lastActivityAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) || null)
  const lastPrintedJobUid = computed(() => connectors.value
    .map((item) => item.lastPrintedJobUid)
    .find(Boolean) || null)

  function errorMessage(error: any, fallback: string) {
    return error?.response?.data?.error?.message || error?.message || fallback
  }

  function persistConnectors() {
    localStorage.setItem(RESTAURANT_PRINT_STORAGE.connectors, JSON.stringify(connectors.value))
  }

  function updateConnector(localConnectorId: string, patch: Partial<RestaurantLocalPrintConnector>) {
    connectors.value = connectors.value.map((item) => item.localId === localConnectorId
      ? { ...item, ...patch }
      : item)
    persistConnectors()
  }

  function printedUids() {
    try { return JSON.parse(localStorage.getItem(RESTAURANT_PRINT_STORAGE.printedJobs) || '[]') as string[] }
    catch { return [] }
  }

  function rememberPrinted(localConnectorId: string, uid: string) {
    localStorage.setItem(
      RESTAURANT_PRINT_STORAGE.printedJobs,
      JSON.stringify([uid, ...printedUids().filter((item) => item !== uid)].slice(0, 500)),
    )
    updateConnector(localConnectorId, { lastPrintedJobUid: uid })
  }

  async function connectQz(notify = true) {
    try {
      await qzTray.connect()
      printers.value = await qzTray.getPrinters()
      qzConnected.value = true
      if (notify) toast.success('QZ Tray conectado')
      return true
    } catch (error: any) {
      qzConnected.value = false
      if (notify) toast.error(errorMessage(error, 'Não foi possível conectar ao QZ Tray.'))
      return false
    }
  }

  async function pollConnector(localConnectorId: string) {
    const connector = connectors.value.find((item) => item.localId === localConnectorId)
    if (!connector?.enabled || !connector.token.trim() || !connector.printer) return
    if (processingConnectorIds.value.includes(localConnectorId)) return
    processingConnectorIds.value = [...processingConnectorIds.value, localConnectorId]

    try {
      const identity = await RestauranteRepository.heartbeatEstacao(connector.token, {
        impressoraNome: connector.printer,
        papel: connector.paper,
      }) as { id?: number; nome?: string }
      updateConnector(localConnectorId, {
        stationId: identity?.id ?? connector.stationId,
        stationName: identity?.nome ?? connector.stationName,
        lastActivityAt: new Date().toISOString(),
        lastError: null,
      })

      const pending = await RestauranteRepository.buscarTrabalhosEstacao(connector.token)
      for (const job of pending) {
        try {
          if (!printedUids().includes(job.uid)) {
            await qzTray.printRaw(job.conteudo, {
              printer: connector.printer,
              paper: job.papel as PaperSize,
              copies: job.vias,
              jobName: `Restaurante ${job.uid}`,
            })
            rememberPrinted(localConnectorId, job.uid)
          }
          await RestauranteRepository.confirmarTrabalhoEstacao(connector.token, {
            uid: job.uid,
            leaseToken: job.leaseToken,
            success: true,
          })
          updateConnector(localConnectorId, { lastActivityAt: new Date().toISOString(), lastError: null })
        } catch (error: any) {
          const message = errorMessage(error, 'Falha local de impressão')
          updateConnector(localConnectorId, { lastError: message })
          await RestauranteRepository.confirmarTrabalhoEstacao(connector.token, {
            uid: job.uid,
            leaseToken: job.leaseToken,
            success: false,
            error: message,
          }).catch(() => undefined)
        }
      }
    } catch (error: any) {
      qzConnected.value = qzTray.isConnected()
      const unauthorized = error?.response?.status === 401
      updateConnector(localConnectorId, {
        enabled: unauthorized ? false : connector.enabled,
        lastError: unauthorized
          ? 'Token inválido ou conector desativado. Gere um novo token e edite esta conexão.'
          : errorMessage(error, 'Conector de impressão indisponível.'),
      })
    } finally {
      processingConnectorIds.value = processingConnectorIds.value.filter((id) => id !== localConnectorId)
    }
  }

  async function pollJobs() {
    if (!enabledConnectors.value.length) return
    if (!qzConnected.value && !(await connectQz(false))) return
    await Promise.all(enabledConnectors.value.map((item) => pollConnector(item.localId)))
  }

  async function saveConnector(input: RestaurantLocalPrintConnectorInput, connectorLocalId?: string) {
    const normalized = { ...input, token: input.token.trim() }
    if (!normalized.token || !normalized.printer) throw new Error('Informe o token e escolha a impressora.')
    const duplicate = connectors.value.find((item) => item.token === normalized.token && item.localId !== connectorLocalId)
    if (duplicate) throw new Error('Este token já está configurado neste computador.')
    const printerInUse = connectors.value.find((item) => item.printer === normalized.printer && item.localId !== connectorLocalId)
    if (printerInUse) throw new Error('Esta impressora já possui uma conexão neste computador. Edite a conexão existente.')

    const id = connectorLocalId || localId()
    const current = connectors.value.find((item) => item.localId === id)
    const next: RestaurantLocalPrintConnector = {
      localId: id,
      stationId: current?.stationId,
      stationName: current?.stationName,
      lastActivityAt: current?.lastActivityAt || null,
      lastError: null,
      lastPrintedJobUid: current?.lastPrintedJobUid || null,
      ...normalized,
    }
    connectors.value = current
      ? connectors.value.map((item) => item.localId === id ? next : item)
      : [...connectors.value, next]
    persistConnectors()

    if (next.enabled) {
      if (!qzConnected.value && !(await connectQz(false))) {
        updateConnector(id, { enabled: false, lastError: 'Abra o QZ Tray para ativar esta conexão.' })
        if (!current) removeConnector(id)
        throw new Error('Abra o QZ Tray para ativar esta conexão.')
      }
      await pollConnector(id)
      const saved = connectors.value.find((item) => item.localId === id)
      if (!saved?.enabled || saved.lastError) {
        const message = saved?.lastError || 'Não foi possível validar o conector.'
        if (!current) removeConnector(id)
        throw new Error(message)
      }
    }
    return connectors.value.find((item) => item.localId === id)!
  }

  async function setConnectorEnabled(localConnectorId: string, enabled: boolean) {
    updateConnector(localConnectorId, { enabled, lastError: null })
    if (enabled) await pollJobs()
    return connectors.value.find((item) => item.localId === localConnectorId)
  }

  function removeConnector(localConnectorId: string) {
    connectors.value = connectors.value.filter((item) => item.localId !== localConnectorId)
    persistConnectors()
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') void pollJobs()
  }

  async function start() {
    if (started.value) return
    started.value = true
    socket = getSocket()
    socket.on('restaurante:impressao', pollJobs)
    window.addEventListener('online', pollJobs)
    document.addEventListener('visibilitychange', onVisibilityChange)
    pollingTimer = setInterval(() => void pollJobs(), 10_000)
    if (serviceEnabled.value) {
      await connectQz(false)
      void pollJobs()
    }
  }

  function stop() {
    if (!started.value) return
    started.value = false
    if (pollingTimer) clearInterval(pollingTimer)
    pollingTimer = null
    socket?.off('restaurante:impressao', pollJobs)
    socket = null
    window.removeEventListener('online', pollJobs)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  return {
    connectors,
    printers,
    qzConnected,
    processingConnectorIds,
    processing,
    started,
    configured,
    serviceEnabled,
    localReady,
    lastError,
    lastActivityAt,
    lastPrintedJobUid,
    connectQz,
    pollJobs,
    pollConnector,
    saveConnector,
    setConnectorEnabled,
    removeConnector,
    start,
    stop,
  }
})
