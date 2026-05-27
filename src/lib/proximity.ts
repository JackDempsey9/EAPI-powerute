import type { Incident, Substation, ProximityAlert, KPIData } from './types'

/**
 * Haversine formula — great-circle distance between two points in km.
 * @param a [lng, lat]
 * @param b [lng, lat]
 */
export function haversineDistance(
  a: [number, number],
  b: [number, number]
): number {
  const R = 6371 // Earth radius km
  const [lon1, lat1] = a
  const [lon2, lat2] = b
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h =
    sinLat * sinLat +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      sinLon * sinLon
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * For each incident, find all substations within `thresholdKm` and
 * return a ProximityAlert for the closest one only.
 */
export function findProximityAlerts(
  incidents: Incident[],
  substations: Substation[],
  thresholdKm: number
): ProximityAlert[] {
  const alerts: ProximityAlert[] = []

  for (const incident of incidents) {
    let nearest: { substation: Substation; distanceKm: number } | null = null

    for (const substation of substations) {
      const dist = haversineDistance(incident.coordinates, substation.coordinates)
      if (dist <= thresholdKm) {
        if (!nearest || dist < nearest.distanceKm) {
          nearest = { substation, distanceKm: dist }
        }
      }
    }

    if (nearest) {
      alerts.push({
        incident,
        substation: nearest.substation,
        distanceKm: nearest.distanceKm,
      })
    }
  }

  return alerts
}

/**
 * Derive KPI values from current state.
 */
export function getKPIData(
  incidents: Incident[],
  proximityAlerts: ProximityAlert[],
  lastUpdated: Date | null
): KPIData {
  const uniqueAtRiskIds = new Set(proximityAlerts.map((a) => a.substation.id))

  const nearestKm =
    proximityAlerts.length > 0
      ? Math.min(...proximityAlerts.map((a) => a.distanceKm))
      : null

  const hasCFSEmergency = incidents.some(
    (i) => i.type === 'Bushfire' && i.status === 'Emergency Warning'
  )
  const hasCFSWatchAct = incidents.some(
    (i) => i.type === 'Bushfire' && i.status === 'Watch and Act'
  )
  const hasBushfire = incidents.some((i) => i.type === 'Bushfire')

  const fireDangerLevel: KPIData['fireDangerLevel'] = hasCFSEmergency
    ? 'Extreme'
    : hasCFSWatchAct
    ? 'High'
    : hasBushfire
    ? 'Moderate'
    : incidents.length > 0
    ? 'Moderate'
    : 'None'

  return {
    activeIncidents: incidents.length,
    fireDangerLevel,
    assetsAtRisk: uniqueAtRiskIds.size,
    nearestIncidentKm: nearestKm ? Math.round(nearestKm * 10) / 10 : null,
    lastUpdated,
    isConnected: lastUpdated !== null,
  }
}

/** Proximity threshold in km by incident type */
export const PROXIMITY_THRESHOLDS: Record<string, number> = {
  Bushfire: 5,
  Storm: 10,
  Flood: 8,
  Accident: 2,
  Rescue: 3,
  Other: 5,
}
