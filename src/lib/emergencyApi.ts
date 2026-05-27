import type { Incident, IncidentType, IncidentStatus } from './types'

const BASE_URL = 'https://api.emergencyapi.com/v1'

/** Map emergencyAPI.com category strings to our IncidentType enum */
export function categoriseIncidentType(category: string): IncidentType {
  const c = category.toLowerCase()
  if (c.includes('fire') || c.includes('bushfire')) return 'Bushfire'
  if (c.includes('storm') || c.includes('thunder') || c.includes('wind')) return 'Storm'
  if (c.includes('flood') || c.includes('water')) return 'Flood'
  if (c.includes('accident') || c.includes('crash') || c.includes('mvc')) return 'Accident'
  if (c.includes('rescue') || c.includes('search')) return 'Rescue'
  return 'Other'
}

function normaliseStatus(status: string): IncidentStatus {
  const s = status.toLowerCase()
  if (s.includes('emergency warning')) return 'Emergency Warning'
  if (s.includes('watch and act') || s.includes('watch & act')) return 'Watch and Act'
  if (s.includes('advice')) return 'Advice'
  if (s.includes('information')) return 'Information'
  return 'Not Applicable'
}

/** Parse a GeoJSON FeatureCollection from emergencyAPI.com into typed Incidents */
export function parseIncidents(collection: GeoJSON.FeatureCollection): Incident[] {
  return collection.features
    .filter(
      (f): f is GeoJSON.Feature<GeoJSON.Point> =>
        f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates)
    )
    .map((f) => {
      const p = f.properties ?? {}
      return {
        id: String(f.id ?? p.id ?? `${Date.now()}-${Math.random()}`),
        type: categoriseIncidentType(String(p.category ?? p.type ?? '')),
        status: normaliseStatus(String(p.status ?? '')),
        title: String(p.title ?? p.name ?? 'Unknown incident'),
        location: String(p.location ?? p.suburb ?? ''),
        state: String(p.state ?? ''),
        source: String(p.sourceOrganisation ?? p.agency ?? p.source ?? ''),
        updatedAt: String(p.updated ?? p.updatedAt ?? new Date().toISOString()),
        coordinates: [
          f.geometry.coordinates[0],
          f.geometry.coordinates[1],
        ] as [number, number],
        link: p.link ? String(p.link) : undefined,
      }
    })
}

/** Fetch all current incidents from emergencyAPI.com */
export async function fetchIncidents(apiKey: string): Promise<Incident[]> {
  const res = await fetch(`${BASE_URL}/incidents`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`emergencyAPI.com error: ${res.status} ${res.statusText}`)
  }

  const data: GeoJSON.FeatureCollection = await res.json()
  return parseIncidents(data)
}
