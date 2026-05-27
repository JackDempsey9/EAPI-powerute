import type { Incident, IncidentType, IncidentStatus } from './types'

// Confirmed correct URL: https://emergencyapi.com/api/v1/incidents (200 with Bearer)
// Wrong URL was: https://api.emergencyapi.com/v1 (DNS failure)
const BASE_URL = 'https://emergencyapi.com/api/v1'

/** Map emergencyAPI.com eventType strings to our IncidentType enum */
export function categoriseIncidentType(category: string): IncidentType {
  const c = category.toLowerCase()
  if (c.includes('fire') || c.includes('bushfire')) return 'Bushfire'
  if (c.includes('storm') || c.includes('thunder') || c.includes('wind')) return 'Storm'
  if (c.includes('flood') || c.includes('water')) return 'Flood'
  if (c.includes('accident') || c.includes('crash') || c.includes('mvc') || c.includes('vehicle')) return 'Accident'
  if (c.includes('rescue') || c.includes('search') || c.includes('medical')) return 'Rescue'
  return 'Other'
}

function normaliseStatus(warningLevel: string): IncidentStatus {
  // API uses dash-separated format: "emergency-warning", "watch-and-act", "advice", "none"
  // Replace dashes with spaces before matching
  const s = warningLevel.toLowerCase().replace(/-/g, ' ')
  if (s.includes('emergency warning')) return 'Emergency Warning'
  if (s.includes('watch and act') || s.includes('watch & act')) return 'Watch and Act'
  if (s.includes('advice')) return 'Advice'
  if (s.includes('information')) return 'Information'
  return 'Not Applicable'
}

/** Parse a GeoJSON FeatureCollection from emergencyAPI.com into typed Incidents.
 *
 *  Actual API property shape (as of 2026-05-27):
 *  - eventType: string (e.g. "bushfire", "flood", "medical")
 *  - warningLevel: string (e.g. "none", "advice", "emergency-warning", "watch-and-act")
 *  - title: string
 *  - location: { state, suburb, address, latitude, longitude }
 *  - source: { state, agency, feedId }
 *  - timestamps: { reported, updated, fetched }
 */
export function parseIncidents(collection: GeoJSON.FeatureCollection): Incident[] {
  return collection.features
    .map((f): Incident | null => {
      if (!f.properties) return null
      const p = f.properties

      // Coordinates: prefer location object (covers both Point + Polygon features),
      // fall back to Point geometry coords if location lat/lng is missing
      let lng: number, lat: number
      if (typeof p.location?.longitude === 'number' && typeof p.location?.latitude === 'number') {
        lng = p.location.longitude
        lat = p.location.latitude
      } else if (f.geometry?.type === 'Point' && Array.isArray((f.geometry as GeoJSON.Point).coordinates)) {
        const coords = (f.geometry as GeoJSON.Point).coordinates
        lng = coords[0]
        lat = coords[1]
      } else {
        return null // Cannot place on map — skip
      }

      return {
        id: String(f.id ?? p.id ?? `${Date.now()}-${Math.random()}`),
        type: categoriseIncidentType(String(p.eventType ?? p.category ?? p.type ?? '')),
        status: normaliseStatus(String(p.warningLevel ?? '')),
        title: String(p.title ?? p.name ?? 'Unknown incident'),
        location: String(
          p.location?.address ?? p.location?.suburb ?? p.location ?? ''
        ),
        state: String(p.location?.state ?? p.source?.state ?? p.state ?? '').toUpperCase(),
        source: String(
          p.source?.agency ?? p.source?.feedId ?? p.sourceOrganisation ?? p.agency ?? ''
        ),
        updatedAt: String(
          p.timestamps?.updated ?? p.timestamps?.fetched ?? p.updated ?? p.updatedAt ?? new Date().toISOString()
        ),
        coordinates: [lng, lat] as [number, number],
        link: p.link ? String(p.link) : undefined,
      }
    })
    .filter((inc): inc is Incident => inc !== null)
}

/** Fetch all current incidents from emergencyAPI.com */
export async function fetchIncidents(apiKey: string): Promise<Incident[]> {
  const res = await fetch(`${BASE_URL}/incidents`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    throw new Error(`emergencyAPI.com error: ${res.status} ${res.statusText}`)
  }

  const data: GeoJSON.FeatureCollection = await res.json()
  return parseIncidents(data)
}
