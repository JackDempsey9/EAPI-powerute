'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { Incident, Substation, TransmissionLine, Outage, ProximityAlert, DashboardSettings } from '@/lib/types'
import { PROXIMITY_THRESHOLDS } from '@/lib/proximity'
import { INCIDENT_META, DEFAULT_META } from '@/lib/incidentMeta'
import { fetchSAPNDistributionFeeders, fetchSAPNLVNetwork, fetchSAPNPoles } from '@/lib/sapnData'
import { PoweredBy } from './PoweredBy'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

/** Escape untrusted strings before inserting into HTML */
function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c)
  )
}

const INCIDENT_COLOURS: Record<string, string> = Object.fromEntries(
  Object.entries(INCIDENT_META).map(([k, v]) => [k, v.hex])
)

interface DashboardMapProps {
  incidents: Incident[]
  substations: Substation[]
  transmissionLines: TransmissionLine[]
  outages: Outage[]
  proximityAlerts: ProximityAlert[]
  selectedIncident: Incident | null
  settings: DashboardSettings
}

export function DashboardMap({
  incidents,
  substations,
  transmissionLines,
  outages,
  proximityAlerts,
  selectedIncident,
  settings,
}: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const readyRef = useRef(false)
  const animFrameRef = useRef<number>(0)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Pre-computed dasharray sequence , each step shifts the dash forward by 0.5 units,
  // creating the illusion of current travelling along the line.
  // Format: [gap-before, dash, gap-after] cycling through 15 frames ≈ 1.4 cycles/sec at 40ms/step
  const FLOW_DASH_SEQUENCE = [
    [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
    [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
    [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5],
    [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1],
    [0, 3.5, 3, 0.5], [0, 4, 3, 0],
  ]

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

    map.on('load', async () => {
      // ── ElectraNet HV transmission lines (132kV–275kV backbone) ──────
      map.addSource('transmission-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'transmission-lines-layer',
        type: 'line',
        source: 'transmission-lines',
        filter: ['!=', ['get', 'operator'], 'SA Power Networks'],
        paint: { 'line-color': '#1e40af', 'line-width': 2, 'line-opacity': 0.6 },
      })
      map.addLayer({
        id: 'transmission-lines-glow',
        type: 'line',
        source: 'transmission-lines',
        filter: ['!=', ['get', 'operator'], 'SA Power Networks'],
        paint: { 'line-color': '#3b82f6', 'line-width': 8, 'line-opacity': 0.1, 'line-blur': 5 },
      })
      // Animated current-flow dash , bright short pulses that travel along ElectraNet lines
      map.addLayer({
        id: 'transmission-lines-flow',
        type: 'line',
        source: 'transmission-lines',
        filter: ['!=', ['get', 'operator'], 'SA Power Networks'],
        paint: {
          'line-color': '#93c5fd',   // blue-300, reads as "electric"
          'line-width': 1.5,
          'line-opacity': 0.9,
          'line-dasharray': [0, 4, 3],
        },
      })

      // ── SAPN 66kV sub-transmission lines ──────────────────────────────
      map.addLayer({
        id: 'sapn-subtrans-layer',
        type: 'line',
        source: 'transmission-lines',
        filter: ['==', ['get', 'operator'], 'SA Power Networks'],
        paint: { 'line-color': '#d97706', 'line-width': 1.5, 'line-opacity': 0.5 },
      })
      map.addLayer({
        id: 'sapn-subtrans-glow',
        type: 'line',
        source: 'transmission-lines',
        filter: ['==', ['get', 'operator'], 'SA Power Networks'],
        paint: { 'line-color': '#fbbf24', 'line-width': 6, 'line-opacity': 0.07, 'line-blur': 3 },
      })
      // Animated flow on SAPN lines (amber pulses)
      map.addLayer({
        id: 'sapn-subtrans-flow',
        type: 'line',
        source: 'transmission-lines',
        filter: ['==', ['get', 'operator'], 'SA Power Networks'],
        paint: {
          'line-color': '#fbbf24',
          'line-width': 1,
          'line-opacity': 0.7,
          'line-dasharray': [0, 4, 3],
        },
      })

      // ── SAPN 11kV/19kV distribution feeders (loaded async, zoom 12+) ──
      map.addSource('distribution-feeders', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'distribution-feeders-layer',
        type: 'line',
        source: 'distribution-feeders',
        minzoom: 12,
        paint: {
          'line-color': '#6b7280',
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 1.5],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0.3, 14, 0.5],
        },
      })
      map.addLayer({
        id: 'distribution-feeders-glow',
        type: 'line',
        source: 'distribution-feeders',
        minzoom: 14,
        paint: {
          'line-color': '#9ca3af',
          'line-width': 4,
          'line-opacity': 0.05,
          'line-blur': 2,
        },
      })

      fetchSAPNDistributionFeeders()
        .then((data) => {
          const source = map.getSource('distribution-feeders') as mapboxgl.GeoJSONSource
          if (source) source.setData(data)
        })
        .catch((err) => console.warn('[DashboardMap] Distribution feeders unavailable:', err))

      // ── LV lines (433V/240V, loaded from local GeoJSON, rendered at zoom 15+) ──
      map.addSource('lv-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'lv-lines-layer',
        type: 'line',
        source: 'lv-lines',
        minzoom: 15,
        paint: {
          'line-color': '#475569',
          'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.5, 18, 1.2],
          'line-opacity': 0.4,
        },
      })

      // ── Poles (loaded from local GeoJSON, rendered at zoom 16+) ──
      map.addSource('poles', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'poles-layer',
        type: 'circle',
        source: 'poles',
        minzoom: 16,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 1.5, 19, 4],
          'circle-color': '#64748b',
          'circle-stroke-width': 0.5,
          'circle-stroke-color': '#94a3b8',
          'circle-opacity': 0.6,
        },
      })

      // Load LV + poles from local files (async, non-blocking)
      fetchSAPNLVNetwork()
        .then((data) => {
          const src = map.getSource('lv-lines') as mapboxgl.GeoJSONSource
          if (src) src.setData(data)
          console.log(`[DashboardMap] LV network loaded: ${data.features.length} segments`)
        })
        .catch((err) => console.warn('[DashboardMap] LV network unavailable:', err))

      fetchSAPNPoles()
        .then((data) => {
          const src = map.getSource('poles') as mapboxgl.GeoJSONSource
          if (src) src.setData(data)
          console.log(`[DashboardMap] Poles loaded: ${data.features.length} poles`)
        })
        .catch((err) => console.warn('[DashboardMap] Poles unavailable:', err))

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

      // ── Substations (SVG icons) ─────────────────────────────────────
      const loadIcon = (name: string, url: string): Promise<void> =>
        new Promise((resolve, reject) => {
          const img = new Image(32, 32)
          img.onload = () => { map.addImage(name, img); resolve() }
          img.onerror = reject
          img.src = url
        })

      await Promise.all([
        loadIcon('substation-normal', '/icons/substation.svg'),
        loadIcon('substation-alert', '/icons/substation-alert.svg'),
      ])

      map.addSource('substations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'substations-glow',
        type: 'circle',
        source: 'substations',
        paint: {
          'circle-radius': 18,
          'circle-color': ['get', 'glowColor'],
          'circle-opacity': 0.12,
          'circle-blur': 1,
        },
      })
      map.addLayer({
        id: 'substations-dot',
        type: 'symbol',
        source: 'substations',
        layout: {
          'icon-image': ['case', ['==', ['get', 'atRisk'], true], 'substation-alert', 'substation-normal'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 10, 0.6, 14, 0.9],
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
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

      // ── Popup system ────────────────────────────────────────────────
      // Single hover popup that queries ALL layers at the cursor point
      // and renders stacked cards for every feature found at that location.
      const hoverPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '320px',
        className: 'incident-popup',
        offset: 12,
      })

      let clickPopup: mapboxgl.Popup | null = null

      const interactiveLayers = [
        'incidents-dot', 'incidents-pulse',
        'substations-dot', 'substations-glow',
        'distribution-feeders-layer',
        'lv-lines-layer', 'poles-layer',
        'transmission-lines-layer', 'transmission-lines-glow', 'transmission-lines-flow',
        'sapn-subtrans-layer', 'sapn-subtrans-glow',
      ]

      function buildCardForFeature(layerId: string, props: Record<string, unknown>): string {
        if (layerId.startsWith('incidents')) {
          const color = INCIDENT_COLOURS[String(props.type)] ?? '#94a3b8'
          return `
            <div style="padding:10px 14px;border-left:3px solid ${color};">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${color};margin-bottom:4px;">${esc(props.type)}</div>
              <div style="font-size:12px;font-weight:600;color:#f1f5f9;line-height:1.3;margin-bottom:3px;">${esc(props.title)}</div>
              <div style="font-size:10px;color:#cbd5e1;margin-bottom:3px;">${esc(props.location)}</div>
              <div style="font-size:10px;color:#94a3b8;">${esc(props.source)} | ${esc(props.status)}</div>
              ${props.nearestSubstation ? `<div style="font-size:10px;font-weight:500;color:#fb923c;margin-top:4px;">${esc(props.distanceKm)} km from ${esc(props.nearestSubstation)}</div>` : ''}
            </div>`
        }

        if (layerId.startsWith('substation')) {
          const atRisk = props.color === '#ef4444'
          return `
            <div style="padding:10px 14px;border-left:3px solid ${atRisk ? '#fb923c' : '#3b82f6'};">
              <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${atRisk ? '#fb923c' : '#3b82f6'};margin-bottom:3px;">ZONE SUBSTATION</div>
              <div style="font-size:12px;font-weight:600;color:#f1f5f9;line-height:1.3;margin-bottom:2px;">${esc(props.name)}</div>
              ${props.voltage ? `<div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">${esc(props.voltage)} | ${esc(props.operator ?? 'SA Power Networks')}</div>` : ''}
              <div style="font-size:10px;font-weight:500;color:${atRisk ? '#fb923c' : '#4ade80'};">${atRisk ? 'AT RISK: Incident nearby' : 'Operational'}</div>
            </div>`
        }

        if (layerId.startsWith('distribution')) {
          return `
            <div style="padding:10px 14px;border-left:3px solid #6b7280;">
              <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:3px;">DISTRIBUTION</div>
              <div style="font-size:11px;font-weight:600;color:#f1f5f9;margin-bottom:2px;">Feeder ${esc(props.feederId)}</div>
              <div style="font-size:10px;color:#94a3b8;">${esc(props.voltage)} | ${esc(props.lineType)} | SA Power Networks</div>
            </div>`
        }

        if (layerId === 'lv-lines-layer') {
          const voltage = String(props.OPERATING_VOLTAGE ?? '433V')
          return `
            <div style="padding:10px 14px;border-left:3px solid #475569;">
              <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:3px;">LOW VOLTAGE</div>
              <div style="font-size:10px;color:#94a3b8;">${esc(voltage)} ${esc(props.ASSET_TYPE ?? 'OH')} | SA Power Networks</div>
            </div>`
        }

        if (layerId === 'poles-layer') {
          return `
            <div style="padding:10px 14px;border-left:3px solid #64748b;">
              <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:3px;">POLE</div>
              <div style="font-size:10px;color:#94a3b8;">${esc(props.ASSET_TYPE ?? 'Stobie')} | SA Power Networks</div>
            </div>`
        }

        // Transmission / sub-transmission lines
        const operator = String(props.operator ?? '')
        const isElectraNet = operator !== 'SA Power Networks'
        const accentColor = isElectraNet ? '#60a5fa' : '#fbbf24'
        const networkLabel = isElectraNet ? 'TRANSMISSION' : 'SUB-TRANSMISSION'
        return `
          <div style="padding:10px 14px;border-left:3px solid ${accentColor};">
            <div style="font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${accentColor};margin-bottom:3px;">${networkLabel}</div>
            ${props.name ? `<div style="font-size:12px;font-weight:600;color:#f1f5f9;line-height:1.3;margin-bottom:2px;">${esc(props.name)}</div>` : ''}
            <div style="font-size:10px;color:#94a3b8;">${props.voltage ? `${esc(props.voltage)} | ` : ''}${esc(operator || 'Unknown')}</div>
          </div>`
      }

      function showStackedPopup(lngLat: mapboxgl.LngLat, point: mapboxgl.Point, isClick: boolean) {
        const cards: string[] = []
        const seen = new Set<string>()

        for (const layerId of interactiveLayers) {
          const features = map.queryRenderedFeatures(point, { layers: [layerId] })
          for (const f of features) {
            const props = f.properties ?? {}
            const dedupKey = `${layerId.split('-')[0]}-${props.name ?? props.title ?? f.id}`
            if (seen.has(dedupKey)) continue
            seen.add(dedupKey)
            cards.push(buildCardForFeature(layerId, props))
          }
        }

        if (cards.length === 0) return

        const html = `<div style="background:#1e2533;border-radius:8px;font-family:system-ui,sans-serif;min-width:200px;overflow:hidden;display:flex;flex-direction:column;gap:1px;${isClick ? 'padding-right:24px;' : ''}">${cards.map(c => `<div style="background:#1e2533;">${c}</div>`).join('<div style="height:1px;background:rgba(148,163,184,0.12);margin:0 14px;"></div>')}</div>`

        if (isClick) {
          if (clickPopup) { clickPopup.remove(); clickPopup = null }
          clickPopup = new mapboxgl.Popup({ closeButton: true, maxWidth: '320px', className: 'incident-popup' })
            .setLngLat(lngLat)
            .setHTML(html)
            .addTo(map)
          clickPopup.on('close', () => { clickPopup = null })
          hoverPopup.remove()
        } else {
          if (clickPopup) return
          hoverPopup.setLngLat(lngLat).setHTML(html).addTo(map)
        }
      }

      // Click on incidents
      map.on('click', 'incidents-dot', (e) => {
        if (!e.features?.[0]) return
        showStackedPopup(e.lngLat, e.point, true)
      })

      // Hover on all interactive layers
      for (const layerId of interactiveLayers) {
        map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layerId, () => {
          map.getCanvas().style.cursor = ''
          hoverPopup.remove()
        })
        map.on('mousemove', layerId, (e) => {
          showStackedPopup(e.lngLat, e.point, false)
        })
      }

      // ── Current-flow animation loop ────────────────────────────────
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let flowStep = 0
      let lastFrameTime = 0
      const animateFlow = (timestamp: number) => {
        if (prefersReducedMotion) return
        if (timestamp - lastFrameTime >= 40) {
          if (mapRef.current) {
            mapRef.current.setPaintProperty(
              'transmission-lines-flow',
              'line-dasharray',
              FLOW_DASH_SEQUENCE[flowStep]
            )
            mapRef.current.setPaintProperty(
              'sapn-subtrans-flow',
              'line-dasharray',
              FLOW_DASH_SEQUENCE[flowStep]
            )
          }
          flowStep = (flowStep + 1) % FLOW_DASH_SEQUENCE.length
          lastFrameTime = timestamp
        }
        animFrameRef.current = requestAnimationFrame(animateFlow)
      }
      if (!prefersReducedMotion) {
        animFrameRef.current = requestAnimationFrame(animateFlow)
      }

      readyRef.current = true
      setMapLoaded(true)  // triggers data effects to re-run with latest data
    })

    mapRef.current = map
    return () => {
      readyRef.current = false
      cancelAnimationFrame(animFrameRef.current)
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
        properties: {
          name: l.name ?? null,
          operator: l.operator ?? null,
          voltage: l.voltage ?? null,
        },
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
            voltage: s.voltage ?? null,
            operator: s.operator ?? null,
            atRisk: isAtRisk,
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
          settings.customRadii[a.incident.type] ?? PROXIMITY_THRESHOLDS[a.incident.type] ?? 0.1,
          INCIDENT_COLOURS[a.incident.type] ?? '#94a3b8'
        )
      ),
    })
  }, [proximityAlerts, makeCircle, mapLoaded, settings.customRadii])

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

  // ── Toggle layer visibility from settings ──────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current
    const vis = (show: boolean) => show ? 'visible' as const : 'none' as const

    const transmissionVis = vis(settings.showTransmissionLines)
    for (const id of ['transmission-lines-layer', 'transmission-lines-glow', 'transmission-lines-flow']) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', transmissionVis)
    }

    const sapnVis = vis(settings.showSAPNLines)
    for (const id of ['sapn-subtrans-layer', 'sapn-subtrans-glow', 'sapn-subtrans-flow']) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', sapnVis)
    }

    const subVis = vis(settings.showSubstations)
    for (const id of ['substations-dot', 'substations-glow']) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', subVis)
    }

    const distVis = vis(settings.showDistributionFeeders !== false)
    for (const id of ['distribution-feeders-layer', 'distribution-feeders-glow']) {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', distVis)
    }

    const lvVis = vis(settings.showLVNetwork !== false)
    if (map.getLayer('lv-lines-layer')) map.setLayoutProperty('lv-lines-layer', 'visibility', lvVis)

    const poleVis = vis(settings.showPoles !== false)
    if (map.getLayer('poles-layer')) map.setLayoutProperty('poles-layer', 'visibility', poleVis)

    const ringVis = vis(settings.showProximityRings)
    if (map.getLayer('proximity-rings-layer')) {
      map.setLayoutProperty('proximity-rings-layer', 'visibility', ringVis)
    }
  }, [mapLoaded, settings.showTransmissionLines, settings.showSAPNLines, settings.showSubstations, settings.showDistributionFeeders, settings.showLVNetwork, settings.showPoles, settings.showProximityRings])

  // ── Fly to selected incident ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedIncident || !mapRef.current || !mapLoaded) return
    mapRef.current.flyTo({
      center: selectedIncident.coordinates,
      zoom: 14,
      duration: 1800,
      essential: true,
    })
  }, [selectedIncident, mapLoaded])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <PoweredBy />
    </div>
  )
}
