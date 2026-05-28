'use client'

import { useState, useEffect } from 'react'

export interface GenerationSource {
  fueltech: string
  mw: number
}

export interface GenerationMix {
  sources: GenerationSource[]
  totalMw: number
  timestamp: string | null
  isLoading: boolean
  error: string | null
}

const POLL_INTERVAL_MS = 60_000

const FUEL_LABELS: Record<string, string> = {
  gas_ccgt: 'Gas (CCGT)',
  gas_ocgt: 'Gas (OCGT)',
  gas_recip: 'Gas (Recip)',
  gas_steam: 'Gas (Steam)',
  wind: 'Wind',
  solar_utility: 'Solar (Utility)',
  solar_rooftop: 'Solar (Rooftop)',
  battery: 'Battery',
  battery_discharging: 'Battery',
  battery_charging: 'Battery (Charging)',
  distillate: 'Distillate',
  coal_black: 'Coal',
  hydro: 'Hydro',
  bioenergy: 'Bioenergy',
  interconnector: 'Interconnector',
}

export function formatFueltech(raw: string): string {
  return FUEL_LABELS[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function useGenerationMix(): GenerationMix {
  const [state, setState] = useState<GenerationMix>({
    sources: [],
    totalMw: 0,
    timestamp: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const now = new Date()
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        const fmt = (d: Date) => d.toISOString().slice(0, 19)

        const url = `https://api.openelectricity.org.au/v4/data/network/NEM?network_region=SA1&metrics=power&interval=5m&primary_grouping=network_region&secondary_grouping=fueltech&date_start=${fmt(twoHoursAgo)}&date_end=${fmt(now)}`

        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
        if (!res.ok) throw new Error(`Open Electricity API: ${res.status}`)

        const json = await res.json()
        if (!json.success) throw new Error(json.error ?? 'API error')

        const results = json.data?.[0]?.results ?? []
        const sources: GenerationSource[] = []

        for (const r of results) {
          const fueltech = r.columns?.fueltech ?? r.name ?? ''
          const data = r.data ?? []
          const latest = data[data.length - 1]
          if (!latest) continue
          const mw = latest[1] ?? 0
          if (fueltech === 'battery_charging') continue
          sources.push({ fueltech, mw })
        }

        sources.sort((a, b) => Math.abs(b.mw) - Math.abs(a.mw))
        const totalMw = sources.reduce((sum, s) => sum + Math.max(0, s.mw), 0)
        const latestTime = results[0]?.data?.slice(-1)?.[0]?.[0] ?? null

        if (!cancelled) {
          setState({
            sources,
            totalMw,
            timestamp: latestTime,
            isLoading: false,
            error: null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to fetch generation data',
          }))
        }
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return state
}
