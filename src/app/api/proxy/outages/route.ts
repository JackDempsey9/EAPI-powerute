import { NextResponse } from 'next/server'
import type { Outage } from '@/lib/types'

const BASE = 'https://outage.apps.sapowernetworks.com.au/Outages'
const CURRENT_URL = `${BASE}/GetPublicisedCurrentOutages/`
const PLANNED_URL = `${BASE}/GetPublicisedPlannedOutages/`

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json, text/javascript, */*; q=0.01',
  'Accept-Language': 'en-AU,en;q=0.9',
  Referer: 'https://outage.apps.sapowernetworks.com.au/OutageReport/OutageMap',
  'X-Requested-With': 'XMLHttpRequest',
}

interface SAPNOutage {
  jobID?: string
  isPaw?: boolean
  startDateTime?: string
  estimatedRestoration?: string
  endDateTime?: string
  reason?: string
  status?: string
  affectedCustomers?: number
  affectedSuburbs?: Array<{ name: string; postcode: string }>
  geometry?: Array<{ lat: number; lng: number }>
}

function parseOutages(data: { currentOutages?: SAPNOutage[]; plannedOutages?: SAPNOutage[] }): Outage[] {
  const outages: Outage[] = []

  for (const item of data.currentOutages ?? []) {
    if (!item.geometry?.length) continue
    const coords: [number, number][] = item.geometry.map((p) => [p.lng, p.lat])
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push([coords[0][0], coords[0][1]])
    }
    outages.push({
      id: String(item.jobID ?? `current-${outages.length}`),
      status: item.status ?? 'Active',
      geometry: { type: 'Polygon', coordinates: [coords] },
      affectedCustomers: item.affectedCustomers,
      estimatedRestoration: item.estimatedRestoration,
      affectedSuburbs: item.affectedSuburbs,
      reason: item.reason,
    })
  }

  for (const item of data.plannedOutages ?? []) {
    if (!item.geometry?.length) continue
    const coords: [number, number][] = item.geometry.map((p) => [p.lng, p.lat])
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push([coords[0][0], coords[0][1]])
    }
    outages.push({
      id: String(item.jobID ?? `planned-${outages.length}`),
      status: 'Planned',
      geometry: { type: 'Polygon', coordinates: [coords] },
      affectedCustomers: item.affectedCustomers,
      estimatedRestoration: item.endDateTime,
      affectedSuburbs: item.affectedSuburbs,
      reason: item.reason,
    })
  }

  return outages
}

export async function GET() {
  try {
    const ts = Date.now()
    const [currentRes, plannedRes] = await Promise.allSettled([
      fetch(`${CURRENT_URL}?_=${ts}`, {
        headers: HEADERS,
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      }),
      fetch(`${PLANNED_URL}?_=${ts}`, {
        headers: HEADERS,
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      }),
    ])

    let currentData: { currentOutages?: SAPNOutage[] } = {}
    let plannedData: { plannedOutages?: SAPNOutage[] } = {}

    if (currentRes.status === 'fulfilled' && currentRes.value.ok) {
      const text = await currentRes.value.text()
      if (!text.trimStart().startsWith('<')) {
        try { currentData = JSON.parse(text) } catch {}
      }
    }

    if (plannedRes.status === 'fulfilled' && plannedRes.value.ok) {
      const text = await plannedRes.value.text()
      if (!text.trimStart().startsWith('<')) {
        try { plannedData = JSON.parse(text) } catch {}
      }
    }

    const outages = parseOutages({ ...currentData, ...plannedData })
    return NextResponse.json(outages)
  } catch (err) {
    console.error('[proxy/outages]', err)
    return NextResponse.json([], { status: 502 })
  }
}
