'use client'

import { useState, useEffect } from 'react'
import type { KPIData } from '@/lib/types'

const FIRE_COLOURS: Record<KPIData['fireDangerLevel'], string> = {
  Catastrophic: 'text-red-400',
  Extreme:      'text-red-400',
  High:         'text-amber-400',
  Moderate:     'text-green-400',
  None:         'text-[#5a7a65]',
}

const FIRE_LEVELS = ['None', 'Moderate', 'High', 'Extreme', 'Catastrophic'] as const
const FIRE_LEVEL_INDEX: Record<string, number> = Object.fromEntries(FIRE_LEVELS.map((l, i) => [l, i]))

interface KPIStripProps {
  kpi: KPIData
}

export function KPIStrip({ kpi }: KPIStripProps) {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1_000)
    return () => clearInterval(id)
  }, [])

  const secondsAgo = kpi.lastUpdated
    ? Math.floor((Date.now() - kpi.lastUpdated.getTime()) / 1000)
    : null

  const isStale = secondsAgo !== null && secondsAgo > 120

  const updatedText = secondsAgo === null
    ? 'CONNECTING'
    : secondsAgo < 60
    ? `${secondsAgo}S AGO`
    : `${Math.floor(secondsAgo / 60)}M AGO`

  const fireStyle = FIRE_COLOURS[kpi.fireDangerLevel]
  const fireLevelIdx = FIRE_LEVEL_INDEX[kpi.fireDangerLevel] ?? 0

  return (
    <div className="flex h-14 border-b border-[#1e3530] flex-shrink-0 bg-[#0f1a16]">
      {/* Active Incidents */}
      <div className="flex-1 flex items-center gap-3 px-4 border-r border-[#1e3530]">
        <div className="font-mono">
          <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#5a7a65]">INCIDENTS</div>
          <div className={`text-xl font-semibold tabular-nums leading-tight font-mono ${kpi.activeIncidents > 0 ? 'text-red-400' : 'text-[#5a7a65]'}`}>
            {kpi.activeIncidents}
          </div>
        </div>
      </div>

      {/* Fire Danger */}
      <div className="flex-1 flex items-center gap-3 px-4 border-r border-[#1e3530]">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#5a7a65]">FIRE DANGER</div>
          <div className={`text-sm font-semibold leading-tight mb-1 font-mono ${fireStyle}`}>
            {kpi.fireDangerLevel.toUpperCase()}
          </div>
          <div className="flex gap-px">
            {FIRE_LEVELS.slice(1).map((level, i) => (
              <div
                key={level}
                className={`h-0.5 flex-1 transition-colors duration-300 ${i < fireLevelIdx ? (fireLevelIdx >= 3 ? 'bg-red-400' : fireLevelIdx >= 2 ? 'bg-amber-400' : 'bg-green-400') : 'bg-[#1e3530]'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Assets at Risk */}
      <div className="flex-1 flex items-center gap-3 px-4 border-r border-[#1e3530]">
        <div className="font-mono">
          <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#5a7a65]">ASSETS AT RISK</div>
          <div className={`text-xl font-semibold tabular-nums leading-tight font-mono ${kpi.assetsAtRisk > 0 ? 'text-amber-400' : 'text-[#5a7a65]'}`}>
            {kpi.assetsAtRisk}
          </div>
        </div>
      </div>

      {/* Nearest Incident */}
      <div className="flex-1 flex items-center gap-3 px-4 border-r border-[#1e3530]">
        <div className="font-mono">
          <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#5a7a65]">NEAREST THREAT</div>
          <div className={`text-xl font-semibold tabular-nums leading-tight font-mono ${kpi.nearestIncidentKm !== null && kpi.nearestIncidentKm < 5 ? 'text-red-400' : 'text-[#5a7a65]'}`}>
            {kpi.nearestIncidentKm !== null ? `${kpi.nearestIncidentKm} KM` : '-'}
          </div>
        </div>
      </div>

      {/* Feed Status */}
      <div className="flex-1 flex items-center gap-3 px-4">
        <div className="font-mono">
          <div className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#5a7a65]">FEED STATUS</div>
          <div className={`text-sm font-semibold leading-tight font-mono ${isStale ? 'text-amber-400' : kpi.isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {kpi.isConnected ? 'ONLINE' : 'OFFLINE'}
          </div>
          <div className="text-[9px] text-[#5a7a65] font-mono">{updatedText}</div>
        </div>
      </div>
    </div>
  )
}
