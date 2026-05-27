'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Incident, Substation, TransmissionLine, Outage, ProximityAlert } from '@/lib/types'
import { PoweredBy } from './PoweredBy'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

/** Escape untrusted strings before inserting into HTML */
function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)
  )
}

const INCIDENT_COLOURS: Record<string, string> = {
  Bushfire: '#ef4444',
  Storm:    '#f97316',
  Flood:    '#eab308',
  Accident: '#60a5fa',
  Rescue:   '#8b5cf6',
  Other:    '#94a3b8',
}

interface DashboardMapProps {
  incidents: Incident[]
  substations: Substation[]
  transmissionLines: TransmissionLine[]
  outages: Outage[]
  proximityAlerts: ProximityAlert[]
}

export function DashboardMap({
  incidents,
  substations,
  transmissionLines,
  outages,
  proximityAlerts,
}: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const readyRef = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  // ── Initialise map once ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [138.6, -34.9],
      zoom: 6,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('load', () => {
      // ── Transmission lines ─────────────────────────────────────────
      map.addSource('transmission-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'transmission-lines-layer',
        type: 'line',
        source: 'transmission-lines',
        paint: {
          'line-color': '#1e40af',
          'line-width': 1.5,
          'line-opacity': 0.5,
        },
      })

      // ── Outage zones ───────────────────────────────────────────────
      map.addSource('outages', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'outages-fill',
        type: 'fill',
        source: 'outages',
        paint: { 'fill-color': '#f97316', 'fill-opacity': 0.2 },
      })
      map.addLayer({
        id: 'outages-stroke',
        type: 'line',
        source: 'outages',
        paint: { 'line-color': '#f97316', 'line-width': 1.5, 'line-opacity': 0.6 },
      })

      // ── Proximity rings ────────────────────────────────────────────
      map.addSource('proximity-rings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'proximity-rings-layer',
        type: 'line',
        source: 'proximity-rings',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': 0.7,
          'line-dasharray': [3, 3],
        },
      })

      // ── Substations ────────────────────────────────────────────────
      map.addSource('substations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      // Outer glow
      map.addLayer({
        id: 'substations-glow',
        type: 'circle',
        source: 'substations',
        paint: {
          'circle-radius': 14,
          'circle-color': ['get', 'glowColor'],
          'circle-opacity': 0.15,
          'circle-blur': 1,
        },
      })
      // Inner dot
      map.addLayer({
        id: 'substations-dot',
        type: 'circle',
        source: 'substations',
        paint: {
          'circle-radius': 5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.3,
        },
      })

      // ── Incidents ──────────────────────────────────────────────────
      map.addSource('incidents', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      // Outer pulse ring
      map.addLayer({
        id: 'incidents-pulse',
        type: 'circle',
        source: 'incidents',
        filter: ['==', ['get', 'status'], 'Emergency Warning'],
        paint: {
          'circle-radius': 20,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.2,
          'circle-blur': 0.5,
        },
      })
      // Main marker
      map.addLayer({
        id: 'incidents-dot',
        type: 'circle',
        source: 'incidents',
        paint: {
          'circle-radius': [
            'match', ['get', 'status'],
            'Emergency Warning', 10,
            'Watch and Act', 8,
            6,
          ],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.6,
        },
      })

      // ── Click handler for incidents ────────────────────────────────
      map.on('click', 'incidents-dot', (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const props = feature.properties ?? {}
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]

        // Use palette colour keyed by type (never trust raw props.color from feature properties)
        const safeColor = INCIDENT_COLOURS[String(props.type)] ?? '#94a3b8'
        new mapboxgl.Popup({ closeButton: true, maxWidth: '280px' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:system-ui;padding:4px;">
              <div style="font-size:13px;font-weight:700;color:${safeColor};margin-bottom:4px;">${esc(props.type)}</div>
              <div style="font-size:12px;font-weight:600;margin-bottom:2px;">${esc(props.title)}</div>
              <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">${esc(props.location)}</div>
              ${props.nearestSubstation ? `<div style="font-size:11px;color:#f97316;">⚡ ${esc(props.distanceKm)}km from ${esc(props.nearestSubstation)}</div>` : ''}
              <div style="font-size:10px;color:#64748b;margin-top:4px;">Source: ${esc(props.source)} · ${esc(props.status)}</div>
            </div>
          `)
          .addTo(map)
      })

      map.on('mouseenter', 'incidents-dot', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'incidents-dot', () => {
        map.getCanvas().style.cursor = ''
      })

      readyRef.current = true
      setMapLoaded(true)  // triggers data effects to re-run with latest data
    })

    mapRef.current = map
    return () => {
      readyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Helper: circle GeoJSON for proximity rings ─────────────────────────
  const makeCircle = useCallback(
    (centre: [number, number], radiusKm: number, color: string, steps = 64): GeoJSON.Feature => {
      const coords: [number, number][] = []
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI
        const dx = (radiusKm / 111.32) / Math.cos((centre[1] * Math.PI) / 180)
        const dy = radiusKm / 110.574
        coords.push([centre[0] + dx * Math.cos(angle), centre[1] + dy * Math.sin(angle)])
      }
      return {
        type: 'Feature',
        properties: { color },
        geometry: { type: 'LineString', coordinates: coords },
      }
    },
    []
  )

  // ── Update transmission lines ──────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const source = mapRef.current.getSource('transmission-lines') as mapboxgl.GeoJSONSource
    if (!source) return
    source.setData({
      type: 'FeatureCollection',
      features: transmissionLines.map((l) => ({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: l.coordinates },
      })),
    })
  }, [transmissionLines, mapLoaded])

  // ── Update substations ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const source = mapRef.current.getSource('substations') as mapboxgl.GeoJSONSource
    if (!source) return
    const atRiskIds = new Set(proximityAlerts.map((a) => a.substation.id))
    source.setData({
      type: 'FeatureCollection',
      features: substations.map((s) => {
        const isAtRisk = atRiskIds.has(s.id)
        return {
          type: 'Feature',
          properties: {
            name: s.name,
            color: isAtRisk ? '#ef4444' : '#3b82f6',
            glowColor: isAtRisk ? '#ef4444' : '#3b82f6',
          },
          geometry: { type: 'Point', coordinates: s.coordinates },
        }
      }),
    })
  }, [substations, proximityAlerts, mapLoaded])

  // ── Update incidents ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const source = mapRef.current.getSource('incidents') as mapboxgl.GeoJSONSource
    if (!source) return

    // Build a lookup: incidentId → nearest substation info
    const alertMap = new Map(proximityAlerts.map((a) => [a.incident.id, a]))

    source.setData({
      type: 'FeatureCollection',
      features: incidents.map((inc) => {
        const alert = alertMap.get(inc.id)
        return {
          type: 'Feature',
          id: inc.id,
          properties: {
            type: inc.type,
            status: inc.status,
            title: inc.title,
            location: inc.location,
            source: inc.source,
            color: INCIDENT_COLOURS[inc.type] ?? '#94a3b8',
            nearestSubstation: alert?.substation.name ?? null,
            distanceKm: alert ? alert.distanceKm.toFixed(1) : null,
          },
          geometry: { type: 'Point', coordinates: inc.coordinates },
        }
      }),
    })
  }, [incidents, proximityAlerts, mapLoaded])

  // ── Update proximity rings ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const source = mapRef.current.getSource('proximity-rings') as mapboxgl.GeoJSONSource
    if (!source) return
    source.setData({
      type: 'FeatureCollection',
      features: proximityAlerts.map((a) =>
        makeCircle(
          a.incident.coordinates,
          5, // 5km radius ring
          INCIDENT_COLOURS[a.incident.type] ?? '#94a3b8'
        )
      ),
    })
  }, [proximityAlerts, makeCircle, mapLoaded])

  // ── Update outage zones ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const source = mapRef.current.getSource('outages') as mapboxgl.GeoJSONSource
    if (!source) return
    source.setData({
      type: 'FeatureCollection',
      features: outages.map((o) => ({
        type: 'Feature',
        properties: { status: o.status },
        geometry: o.geometry,
      })),
    })
  }, [outages, mapLoaded])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <PoweredBy />
    </div>
  )
}
