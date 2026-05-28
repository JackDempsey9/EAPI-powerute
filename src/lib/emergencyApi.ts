import type { Incident, IncidentType, IncidentStatus } from './types'

// Confirmed correct URL: https://emergencyapi.com/api/v1/incidents (200 with Bearer)
// Wrong URL was: https://api.emergencyapi.com/v1 (DNS failure)
const BASE_URL = 'https://emergencyapi.com/api/v1'

// Maps every known eventType from /v1/schema to our IncidentType.
// Respects the API's own eventCategories: fire, weather, rescue, hazmat,
// medical, alarm, planned, earth, other.
const EVENT_TYPE_MAP: Record<string, IncidentType> = {
  // fire category
  bushfire:         'Bushfire',
  bush_fire:        'Bushfire',
  grass_fire:       'Bushfire',
  burn_off:         'Bushfire',
  vehicle_fire:     'Bushfire',
  structure_fire:   'Structure Fire',
  // alarm category
  alarm:            'Alarm',
  // weather category
  storm:            'Storm',
  thunderstorm:     'Storm',
  cyclone:          'Storm',
  extreme_heat:     'Storm',
  flood:            'Flood',
  // rescue category
  vehicle_accident: 'Accident',
  accident:         'Accident',
  rescue:           'Rescue',
  search:           'Rescue',
  // medical category
  medical:          'Medical',
  // other
  hazmat:           'Other',
  earthquake:       'Other',
  other:            'Other',
}

/** Map emergencyAPI.com eventType strings to our IncidentType enum */
export function categoriseIncidentType(category: string): IncidentType {
  const c = category.toLowerCase().replace(/ /g, '_')
  if (EVENT_TYPE_MAP[c]) return EVENT_TYPE_MAP[c]
  // Fuzzy fallbacks for future/unanticipated values
  if (c.includes('fire') || c.includes('burn')) return 'Bushfire'
  if (c.includes('alarm')) return 'Alarm'
  if (c.includes('storm') || c.includes('thunder') || c.includes('wind') || c.includes('cyclone')) return 'Storm'
  if (c.includes('flood')) return 'Flood'
  if (c.includes('accident') || c.includes('crash')) return 'Accident'
  if (c.includes('rescue') || c.includes('search')) return 'Rescue'
  if (c.includes('medical') || c.includes('ambulance')) return 'Medical'
  return 'Other'
}

function normaliseStatus(warningLevel: string): IncidentStatus {
  // Schema warningLevels: advice, watch_and_act, emergency_warning, none
  // Normalise dashes/underscores to spaces for matching
  const s = warningLevel.toLowerCase().replace(/[-_]/g, ' ')
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
        return null // Cannot place on map , skip
      }

      return {
        // Core
        id: String(f.id ?? p.id ?? `${Date.now()}-${Math.random()}`),
        type: categoriseIncidentType(String(p.eventType ?? p.category ?? p.type ?? '')),
        status: normaliseStatus(String(p.warningLevel ?? '')),
        title: String(p.title ?? p.name ?? 'Unknown incident'),
        location: String(p.location?.address ?? p.location?.suburb ?? p.location ?? ''),
        state: String(p.location?.state ?? p.source?.state ?? p.state ?? '').toUpperCase(),
        source: String(p.source?.agency ?? p.source?.feedId ?? p.sourceOrganisation ?? p.agency ?? ''),
        updatedAt: String(p.timestamps?.updated ?? p.timestamps?.fetched ?? p.updated ?? p.updatedAt ?? new Date().toISOString()),
        coordinates: [lng, lat] as [number, number],
        // Extended
        suburb: p.location?.suburb ? String(p.location.suburb) : undefined,
        feedId: p.source?.feedId ? String(p.source.feedId) : undefined,
        severity: p.severity ? String(p.severity) : undefined,
        urgency: p.urgency ? String(p.urgency) : undefined,
        certainty: p.certainty ? String(p.certainty) : undefined,
        resources: typeof p.details?.resources === 'number' ? p.details.resources : undefined,
        aircraft: typeof p.details?.aircraft === 'number' ? p.details.aircraft : undefined,
        reportedAt: p.timestamps?.reported ? String(p.timestamps.reported) : undefined,
        link: p.link ? String(p.link) : undefined,
      }
    })
    .filter((inc): inc is Incident => inc !== null)
}

/**
 * Fetch all active incidents from emergencyAPI.com, following cursor pagination.
 * Covers all Australian states and territories (30 feeds).
 */
export async function fetchIncidents(apiKey: string): Promise<Incident[]> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  }

  let cursor: string | null = null
  const allFeatures: GeoJSON.Feature[] = []

  do {
    const url = new URL(`${BASE_URL}/incidents`)
    url.searchParams.set('state', 'sa')   // SA incidents only , this is an SA infrastructure showcase
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      throw new Error(`emergencyAPI.com error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json() as GeoJSON.FeatureCollection & { metadata?: { nextCursor?: string } }
    allFeatures.push(...data.features)
    cursor = data.metadata?.nextCursor ?? null
  } while (cursor)

  return parseIncidents({ type: 'FeatureCollection', features: allFeatures })
}
