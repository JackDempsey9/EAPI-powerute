import { describe, it, expect } from 'vitest'
import { parseIncidents, categoriseIncidentType } from './emergencyApi'

// Mock using the ACTUAL emergencyAPI.com property format
const mockFeature: GeoJSON.Feature = {
  type: 'Feature',
  id: 'sa-cfs-abc123',
  properties: {
    source: { state: 'SA', agency: 'CFS', feedId: 'sa-cfs' },
    title: 'Bushfire - McLaren Vale',
    eventType: 'bushfire',
    status: 'active',
    warningLevel: 'emergency-warning',
    severity: 'Unknown',
    location: {
      state: 'SA',
      suburb: 'McLaren Vale',
      address: 'McLaren Vale Road',
      latitude: -35.09,
      longitude: 138.71,
    },
    timestamps: {
      reported: null,
      updated: '2026-05-27T10:00:00Z',
      fetched: '2026-05-27T10:00:00Z',
    },
  },
  geometry: { type: 'Point', coordinates: [138.71, -35.09] },
}

describe('categoriseIncidentType', () => {
  // Exact API values (snake_case as returned by emergencyapi.com/api/v1/incidents)
  it('maps bushfire to Bushfire', () => {
    expect(categoriseIncidentType('bushfire')).toBe('Bushfire')
  })
  it('maps storm to Storm', () => {
    expect(categoriseIncidentType('storm')).toBe('Storm')
  })
  it('maps flood to Flood', () => {
    expect(categoriseIncidentType('flood')).toBe('Flood')
  })
  it('maps vehicle_accident to Accident (exact API value)', () => {
    expect(categoriseIncidentType('vehicle_accident')).toBe('Accident')
  })
  // Fuzzy fallbacks for future/unanticipated values
  it('maps Thunderstorm (fuzzy) to Storm', () => {
    expect(categoriseIncidentType('Thunderstorm')).toBe('Storm')
  })
  it('maps rescue to Rescue', () => {
    expect(categoriseIncidentType('rescue')).toBe('Rescue')
  })
  it('maps vehicle_accident to Accident', () => {
    expect(categoriseIncidentType('vehicle_accident')).toBe('Accident')
  })
  it('maps medical to Medical', () => {
    expect(categoriseIncidentType('medical')).toBe('Medical')
  })
  it('maps structure_fire to Structure Fire', () => {
    expect(categoriseIncidentType('structure_fire')).toBe('Structure Fire')
  })
  it('maps alarm to Alarm (alarm category per /v1/schema)', () => {
    expect(categoriseIncidentType('alarm')).toBe('Alarm')
  })
  it('maps burn_off to Bushfire (fire category)', () => {
    expect(categoriseIncidentType('burn_off')).toBe('Bushfire')
  })
  it('maps vehicle_fire to Bushfire (fire category)', () => {
    expect(categoriseIncidentType('vehicle_fire')).toBe('Bushfire')
  })
  it('maps grass_fire to Bushfire (fire category)', () => {
    expect(categoriseIncidentType('grass_fire')).toBe('Bushfire')
  })
  it('maps unknown to Other', () => {
    expect(categoriseIncidentType('SomethingElse')).toBe('Other')
  })
})

describe('parseIncidents', () => {
  it('parses a feature with the actual API shape', () => {
    const collection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [mockFeature],
    }
    const incidents = parseIncidents(collection)
    expect(incidents).toHaveLength(1)
    expect(incidents[0].type).toBe('Bushfire')
    expect(incidents[0].coordinates).toEqual([138.71, -35.09])
    expect(incidents[0].status).toBe('Emergency Warning')
    expect(incidents[0].source).toBe('CFS')
    expect(incidents[0].state).toBe('SA')
    expect(incidents[0].location).toBe('McLaren Vale Road')
    expect(incidents[0].updatedAt).toBe('2026-05-27T10:00:00Z')
  })

  it('handles warningLevel: "none" as Not Applicable', () => {
    const feature: GeoJSON.Feature = {
      ...mockFeature,
      properties: { ...mockFeature.properties, warningLevel: 'none' },
    }
    const incidents = parseIncidents({ type: 'FeatureCollection', features: [feature] })
    expect(incidents[0].status).toBe('Not Applicable')
  })

  it('handles "watch-and-act" warningLevel (dash format)', () => {
    const feature: GeoJSON.Feature = {
      ...mockFeature,
      properties: { ...mockFeature.properties, warningLevel: 'watch-and-act' },
    }
    const incidents = parseIncidents({ type: 'FeatureCollection', features: [feature] })
    expect(incidents[0].status).toBe('Watch and Act')
  })

  it('parses Polygon geometry using location lat/lng', () => {
    const polyFeature: GeoJSON.Feature = {
      type: 'Feature',
      id: 'poly-1',
      properties: {
        ...mockFeature.properties,
        location: { state: 'SA', suburb: 'Test', address: 'Test', latitude: -34.5, longitude: 138.2 },
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[138.2, -34.5], [138.3, -34.5], [138.3, -34.6], [138.2, -34.5]]],
      },
    }
    const incidents = parseIncidents({ type: 'FeatureCollection', features: [polyFeature] })
    expect(incidents).toHaveLength(1)
    expect(incidents[0].coordinates).toEqual([138.2, -34.5])
  })

  it('skips features with no usable coordinates', () => {
    const bad: GeoJSON.Feature = {
      type: 'Feature',
      id: 'bad',
      properties: { eventType: 'bushfire', warningLevel: 'none', title: 'Test' },
      geometry: { type: 'LineString', coordinates: [[138, -35], [139, -35]] },
    }
    const incidents = parseIncidents({ type: 'FeatureCollection', features: [bad] })
    expect(incidents).toHaveLength(0)
  })

  it('returns empty array for empty collection', () => {
    expect(parseIncidents({ type: 'FeatureCollection', features: [] })).toHaveLength(0)
  })
})
