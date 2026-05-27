import { describe, it, expect } from 'vitest'
import { parseIncidents, categoriseIncidentType } from './emergencyApi'

const mockFeature: GeoJSON.Feature = {
  type: 'Feature',
  id: 'abc123',
  properties: {
    category: 'Fire',
    status: 'Emergency Warning',
    title: 'Bushfire - McLaren Vale',
    location: 'McLaren Vale SA',
    state: 'SA',
    sourceOrganisation: 'CFS',
    updated: '2026-05-27T10:00:00Z',
    link: 'https://cfs.sa.gov.au/incidents/123',
  },
  geometry: { type: 'Point', coordinates: [138.71, -35.09] },
}

describe('categoriseIncidentType', () => {
  it('maps Fire to Bushfire', () => {
    expect(categoriseIncidentType('Fire')).toBe('Bushfire')
  })
  it('maps Thunderstorm to Storm', () => {
    expect(categoriseIncidentType('Thunderstorm')).toBe('Storm')
  })
  it('maps Flood to Flood', () => {
    expect(categoriseIncidentType('Flood')).toBe('Flood')
  })
  it('maps unknown to Other', () => {
    expect(categoriseIncidentType('SomethingElse')).toBe('Other')
  })
})

describe('parseIncidents', () => {
  it('parses a valid GeoJSON FeatureCollection', () => {
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
  })

  it('skips features without Point geometry', () => {
    const withPolygon: GeoJSON.Feature = {
      ...mockFeature,
      geometry: { type: 'Polygon', coordinates: [] },
    }
    const collection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [withPolygon],
    }
    expect(parseIncidents(collection)).toHaveLength(0)
  })

  it('returns empty array for empty collection', () => {
    expect(parseIncidents({ type: 'FeatureCollection', features: [] })).toHaveLength(0)
  })
})
