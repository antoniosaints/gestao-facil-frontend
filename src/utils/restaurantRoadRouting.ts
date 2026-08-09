export type RoadRouteGeometry = { type: 'LineString'; coordinates: Array<[number, number]> }
type OsrmRoute = { geometry?: RoadRouteGeometry; distance?: number; duration?: number }
type OsrmRouteResponse = { code?: string; routes?: OsrmRoute[] }

export type RoadRoute = { geometry: RoadRouteGeometry; distance: number; duration: number }

const OSRM_BASE_URL = 'https://router.project-osrm.org'
const routeCache = new Map<string, RoadRoute>()

type Coordinates = readonly [number, number, number?]

function routeCacheKey(start: Coordinates, end: Coordinates) {
  return `${start[0].toFixed(6)},${start[1].toFixed(6)}:${end[0].toFixed(6)},${end[1].toFixed(6)}`
}

export async function calculateRestaurantRoadRoute(
  start: Coordinates,
  end: Coordinates,
  signal: AbortSignal,
): Promise<RoadRoute> {
  const cacheKey = routeCacheKey(start, end)
  const cached = routeCache.get(cacheKey)
  if (cached) return cached

  const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`
  const response = await fetch(
    `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?alternatives=3&overview=full&geometries=geojson&steps=false`,
    { signal },
  )
  if (!response.ok) throw new Error(`OSRM ${response.status}`)

  const body = (await response.json()) as OsrmRouteResponse
  const route = body.routes
    ?.filter(
      (
        candidate,
      ): candidate is OsrmRoute & {
        geometry: RoadRouteGeometry
        distance: number
        duration: number
      } =>
        candidate.geometry?.type === 'LineString' &&
        candidate.geometry.coordinates.length > 0 &&
        Number.isFinite(candidate.distance) &&
        Number.isFinite(candidate.duration),
    )
    .sort((first, second) => first.distance - second.distance)[0]
  if (body.code !== 'Ok' || !route) throw new Error('OSRM não retornou uma rota válida.')

  const selected = { geometry: route.geometry, distance: route.distance, duration: route.duration }
  if (routeCache.size >= 100) {
    const oldestKey = routeCache.keys().next().value
    if (oldestKey) routeCache.delete(oldestKey)
  }
  routeCache.set(cacheKey, selected)
  return selected
}
