import type { Outage } from './types'

/**
 * Fetch SAPN outage data via our server-side proxy.
 * The proxy at /api/proxy/outages spoofs User-Agent + Referer to
 * bypass the WAF on SAPN's public outage map endpoints.
 *
 * Returns [] gracefully if proxy is unavailable , dashboard degrades
 * without the outage layer, all other layers continue normally.
 *
 * See docs/SAPN-OUTAGE-PROXY.md for the full pattern explanation.
 */
export async function fetchOutages(): Promise<Outage[]> {
  try {
    const res = await fetch('/api/proxy/outages', {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      console.warn(`[sapnOutage] Proxy returned ${res.status} , outage layer disabled`)
      return []
    }

    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.info('[sapnOutage] Outage proxy unavailable , outage layer disabled:', err)
    return []
  }
}
