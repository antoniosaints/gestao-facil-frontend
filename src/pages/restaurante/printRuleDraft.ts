export type PrintStationRoute = {
  estacaoId: number | null
  fallbackEstacaoId: number | null
}

export function changePrimaryStation<T extends PrintStationRoute>(draft: T, stationId: number): T {
  if (draft.fallbackEstacaoId !== stationId) return { ...draft, estacaoId: stationId }
  return {
    ...draft,
    estacaoId: stationId,
    fallbackEstacaoId: draft.estacaoId && draft.estacaoId !== stationId ? draft.estacaoId : null,
  }
}

export function swapPrintStations<T extends PrintStationRoute>(draft: T): T {
  if (!draft.estacaoId || !draft.fallbackEstacaoId) return draft
  return { ...draft, estacaoId: draft.fallbackEstacaoId, fallbackEstacaoId: draft.estacaoId }
}

export function availableFallbackStations<T extends { id: number }>(stations: T[], primaryId?: number | null) {
  return stations.filter((station) => station.id !== primaryId)
}
