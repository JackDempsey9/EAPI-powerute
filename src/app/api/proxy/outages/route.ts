import { NextResponse } from 'next/server'
import type { Outage } from '@/lib/types'

// Owner to replace these with real URLs from DevTools discovery
// See docs/SAPN-OUTAGE-PROXY.md for discovery instructions
const CURRENT_URL = 'https://www.sapowernetworks.com.au/api/outages/GetCurrentOutages/'
const PLANNED_URL = 'https://www.sapowernetworks.com.au/api/outages/GetPlannedOutages/'

// Spoof browser headers to pass the WAF check
const SPOOF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-AU,en;q=0.9',
  // Critical header. Must match the exact Referer the browser sends
  Referer: 'https://www.sapowernetworks.com.au/power-outages/current-outages/',
  'X-Requested-With': 'XMLHttpRequest',
}

function coordsToGeoJsonPolygon(
  points: Array<{ lat: number; lng: number } | number[]>
): [number, number][] {
  const coords: [number, number][] = points.map((p) =>
    Array.isArray(p)
      ? [p[1], p[0]]               // [lat,lng] array → [lng,lat] GeoJSON
      : [p.lng, p.lat]             // {lat,lng} object → [lng,lat] GeoJSON
  )
  // Close the ring: first point must equal last point
  if (coords.length > 0) {
    const first = coords[0]
    const last = coords[coords.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push([first[0], first[1]])
    }
  }
  return coords
}

function parseOutages(data: unknown, isPlanned: boolean): Outage[] {
  if (!Array.isArray(data)) return []

  return data
    .filter((item) => item && (item.points ?? item.coordinates ?? item.polygon))
    .map((item, i): Outage => {
      const rawCoords = item.points ?? item.coordinates ?? item.polygon ?? []
      const coords = coordsToGeoJsonPolygon(rawCoords)

      return {
        id: String(item.id ?? item.outageId ?? `${isPlanned ? 'planned' : 'current'}-${i}`),
        status: isPlanned ? 'Planned Outage' : String(item.status ?? 'Active Outage'),
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        affectedCustomers: item.customersAffected ?? item.customers ?? undefined,
        estimatedRestoration: item.estimatedRestoration ?? item.eta ?? undefined,
      }
    })
}

export async function GET() {
  try {
    const ts = Date.now()
    const [currentRes, plannedRes] = await Promise.allSettled([
      fetch(`${CURRENT_URL}?_=${ts}`, {
        headers: SPOOF_HEADERS,
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      }),
      fetch(`${PLANNED_URL}?_=${ts}`, {
        headers: SPOOF_HEADERS,
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      }),
    ])

    const outages: Outage[] = []

    for (const [settled, isPlanned] of [
      [currentRes, false],
      [plannedRes, true],
    ] as const) {
      if (settled.status !== 'fulfilled' || !settled.value.ok) continue

      const text = await settled.value.text()

      // WAF blocked us , returned HTML instead of JSON
      if (text.trimStart().startsWith('<')) {
        console.warn('[proxy/outages] WAF blocked request , check Referer header')
        continue
      }

      try {
        const json = JSON.parse(text)
        outages.push(...parseOutages(json, isPlanned))
      } catch {
        console.warn('[proxy/outages] Failed to parse response JSON')
      }
    }

    return NextResponse.json(outages)
  } catch (err) {
    console.error('[proxy/outages]', err)
    return NextResponse.json([], { status: 502 })
  }
}
