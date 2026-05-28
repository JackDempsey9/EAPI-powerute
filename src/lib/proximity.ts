import type { Incident, Substation, ProximityAlert, KPIData } from './types'

/**
 * Haversine formula , great-circle distance between two points in km.
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

  const fireTypes = new Set(['Bushfire', 'Structure Fire'])
  const hasFireEmergency = incidents.some(
    (i) => fireTypes.has(i.type) && i.status === 'Emergency Warning'
  )
  const hasFireWatchAct = incidents.some(
    (i) => fireTypes.has(i.type) && i.status === 'Watch and Act'
  )
  const hasFireIncident = incidents.some((i) => fireTypes.has(i.type))

  const fireDangerLevel: KPIData['fireDangerLevel'] = hasFireEmergency
    ? 'Extreme'
    : hasFireWatchAct
    ? 'High'
    : hasFireIncident
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

/**
 * Proximity threshold in km per incident type , how close an incident needs
 * to be to a substation before it triggers an alert and draws a ring on the map.
 */
export const PROXIMITY_THRESHOLDS: Record<string, number> = {
  'Bushfire':        5.0,    // 5 km  , fire front can travel kilometres quickly
  'Structure Fire':  0.25,   // 250 m , building fire, localised
  'Storm':           5.0,    // 5 km  , wind/debris/trees down over wide area
  Flood:    5.0,    // 5 km  , flood corridors can be broad
  Accident: 0.25,   // 250 m , road incident, very localised
  Rescue:   0.15,   // 150 m , road crash rescue, search ops
  Medical:  0.15,   // 150 m , SAAS-PAGER ambulance callouts, street-level
  Alarm:    0.15,   // 150 m , MFS fire alarms, building-level
  'Tree Down': 0.05, // 50 m , tree on/near powerline, very localised direct contact
  Other:    0.15,   // 150 m
}
