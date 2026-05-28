import type { Incident } from './types'
import { haversineDistance } from './proximity'

export interface FeederImpact {
  incident: Incident
  feederId: string
  voltage: string
  lineType: string
  distanceM: number
}

const IMPACT_TYPES = new Set([
  'Bushfire', 'Structure Fire', 'Storm', 'Flood', 'Accident', 'Alarm', 'Tree Down',
])

const MAX_DISTANCE_M = 50

/**
 * Check if any incidents are within 50m of a distribution feeder segment.
 * Uses the feeder GeoJSON already loaded in memory.
 * Returns identified feeder impacts sorted by distance.
 */
export function detectFeederImpacts(
  incidents: Incident[],
  feederData: GeoJSON.FeatureCollection | null,
): FeederImpact[] {
  if (!feederData || !feederData.features.length || !incidents.length) return []

  const relevant = incidents.filter((i) => IMPACT_TYPES.has(i.type))
  if (!relevant.length) return []

  const impacts: FeederImpact[] = []

  for (const incident of relevant) {
    let closest: { feederId: string; voltage: string; lineType: string; dist: number } | null = null

    for (const feature of feederData.features) {
      const props = feature.properties ?? {}
      const geom = feature.geometry
      if (!geom || geom.type !== 'LineString') continue

      const coords = (geom as GeoJSON.LineString).coordinates
      for (const coord of coords) {
        const dist = haversineDistance(
          incident.coordinates,
          [coord[0], coord[1]] as [number, number]
        ) * 1000

        if (dist < MAX_DISTANCE_M && (!closest || dist < closest.dist)) {
          closest = {
            feederId: String(props.feederId ?? ''),
            voltage: String(props.voltage ?? '11kV'),
            lineType: String(props.lineType ?? 'Overhead'),
            dist,
          }
        }
      }
    }

    if (closest) {
      impacts.push({
        incident,
        feederId: closest.feederId,
        voltage: closest.voltage,
        lineType: closest.lineType,
        distanceM: Math.round(closest.dist),
      })
    }
  }

  return impacts.sort((a, b) => a.distanceM - b.distanceM)
}
