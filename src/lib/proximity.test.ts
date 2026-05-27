import { describe, it, expect } from 'vitest'
import {
  haversineDistance,
  findProximityAlerts,
  getKPIData,
} from './proximity'
import type { Incident, Substation, ProximityAlert } from './types'

const mockSubstation: Substation = {
  id: 'sub-1',
  name: 'Meadows Zone Substation',
  coordinates: [138.71, -35.09],
}

const mockIncidentNear: Incident = {
  id: 'inc-1',
  type: 'Bushfire',
  status: 'Emergency Warning',
  title: 'Bushfire - McLaren Vale',
  location: 'McLaren Vale',
  state: 'SA',
  source: 'CFS',
  updatedAt: '2026-05-27T10:00:00Z',
  coordinates: [138.74, -35.10],  // ~2.5km from Meadows
}

const mockIncidentFar: Incident = {
  id: 'inc-2',
  type: 'Storm',
  status: 'Watch and Act',
  title: 'Storm - Port Augusta',
  location: 'Port Augusta',
  state: 'SA',
  source: 'SES',
  updatedAt: '2026-05-27T10:00:00Z',
  coordinates: [137.77, -32.49],  // >300km away
}

describe('haversineDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistance([138.6, -34.9], [138.6, -34.9])).toBe(0)
  })

  it('calculates Adelaide to Port Augusta as ~300km', () => {
    const dist = haversineDistance([138.6, -34.9], [137.77, -32.49])
    expect(dist).toBeGreaterThan(270)
    expect(dist).toBeLessThan(320)
  })

  it('calculates short distance accurately', () => {
    // McLaren Vale substation area to nearby point ~2.5km
    const dist = haversineDistance([138.71, -35.09], [138.74, -35.10])
    expect(dist).toBeGreaterThan(1)
    expect(dist).toBeLessThan(5)
  })
})

describe('findProximityAlerts', () => {
  it('returns alert when incident is within threshold', () => {
    const alerts = findProximityAlerts([mockIncidentNear], [mockSubstation], 5)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].incident.id).toBe('inc-1')
    expect(alerts[0].substation.id).toBe('sub-1')
    expect(alerts[0].distanceKm).toBeLessThan(5)
  })

  it('returns no alert when incident is outside threshold', () => {
    const alerts = findProximityAlerts([mockIncidentFar], [mockSubstation], 5)
    expect(alerts).toHaveLength(0)
  })

  it('returns empty array when inputs are empty', () => {
    expect(findProximityAlerts([], [mockSubstation], 5)).toHaveLength(0)
    expect(findProximityAlerts([mockIncidentNear], [], 5)).toHaveLength(0)
  })

  it('finds the nearest substation for each incident', () => {
    const sub2: Substation = { id: 'sub-2', name: 'Far Sub', coordinates: [139.0, -35.5] }
    const alerts = findProximityAlerts([mockIncidentNear], [mockSubstation, sub2], 10)
    // Should find the closest substation
    expect(alerts[0].substation.id).toBe('sub-1')
  })
})

describe('getKPIData', () => {
  it('returns zero/null state when no incidents', () => {
    const kpi = getKPIData([], [], null)
    expect(kpi.activeIncidents).toBe(0)
    expect(kpi.assetsAtRisk).toBe(0)
    expect(kpi.nearestIncidentKm).toBeNull()
    expect(kpi.fireDangerLevel).toBe('None')
  })

  it('sets fireDangerLevel to Extreme when CFS Emergency Warning present', () => {
    const kpi = getKPIData([mockIncidentNear], [], null)
    expect(kpi.fireDangerLevel).toBe('Extreme')
  })

  it('counts unique at-risk substations', () => {
    const alerts: ProximityAlert[] = [
      { incident: mockIncidentNear, substation: mockSubstation, distanceKm: 2.1 },
    ]
    const kpi = getKPIData([mockIncidentNear], alerts, new Date())
    expect(kpi.assetsAtRisk).toBe(1)
  })
})
