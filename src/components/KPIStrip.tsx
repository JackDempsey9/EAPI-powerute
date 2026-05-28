'use client'

import { useState, useEffect } from 'react'
import {
  AlertCircle, Flame, Zap, Radar, Radio,
} from 'lucide-react'
import type { KPIData } from '@/lib/types'

const FIRE_COLOURS: Record<KPIData['fireDangerLevel'], { text: string; bar: string; bg: string }> = {
  Catastrophic: { text: 'text-red-300',    bar: 'bg-red-500',    bg: 'bg-red-500/10' },
  Extreme:      { text: 'text-orange-300', bar: 'bg-orange-500', bg: 'bg-orange-500/10' },
  High:         { text: 'text-yellow-300', bar: 'bg-yellow-500', bg: 'bg-yellow-500/10' },
  Moderate:     { text: 'text-green-300',  bar: 'bg-green-500',  bg: 'bg-green-500/10' },
  None:         { text: 'text-slate-400',  bar: 'bg-slate-600',  bg: 'bg-slate-600/10' },
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
    ? 'Connecting...'
    : secondsAgo < 60
    ? `${secondsAgo}s ago`
    : `${Math.floor(secondsAgo / 60)}m ago`

  const fireStyle = FIRE_COLOURS[kpi.fireDangerLevel]
  const fireLevelIdx = FIRE_LEVEL_INDEX[kpi.fireDangerLevel] ?? 0

  return (
    <div className="flex h-[72px] border-b border-slate-700/50 gap-px bg-slate-800/30 flex-shrink-0">
      {/* Active Incidents */}
      <div className="flex-1 flex items-center gap-3 px-4 bg-[#111827]">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.activeIncidents > 0 ? 'bg-red-500/15' : 'bg-slate-700/30'}`}>
          <AlertCircle size={20} className={kpi.activeIncidents > 0 ? 'text-red-400' : 'text-slate-500'} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Active Incidents</div>
          <div className={`text-2xl font-bold tabular-nums leading-tight ${kpi.activeIncidents > 0 ? 'text-red-400' : 'text-slate-300'}`}>
            {kpi.activeIncidents}
          </div>
        </div>
      </div>

      {/* Fire Danger , segmented gauge */}
      <div className="flex-1 flex items-center gap-3 px-4 bg-[#111827]">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fireStyle.bg}`}>
          <Flame size={20} className={fireStyle.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Fire Danger</div>
          <div className={`text-sm font-bold leading-tight mb-1 ${fireStyle.text}`}>
            {kpi.fireDangerLevel}
          </div>
          <div className="flex gap-0.5">
            {FIRE_LEVELS.slice(1).map((level, i) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < fireLevelIdx ? fireStyle.bar : 'bg-slate-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Assets at Risk */}
      <div className="flex-1 flex items-center gap-3 px-4 bg-[#111827]">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.assetsAtRisk > 0 ? 'bg-orange-500/15' : 'bg-slate-700/30'}`}>
          <Zap size={20} className={kpi.assetsAtRisk > 0 ? 'text-orange-400' : 'text-slate-500'} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Assets at Risk</div>
          <div className={`text-2xl font-bold tabular-nums leading-tight ${kpi.assetsAtRisk > 0 ? 'text-orange-400' : 'text-slate-300'}`}>
            {kpi.assetsAtRisk}
          </div>
          {kpi.assetsAtRisk > 0 && (
            <div className="text-[10px] text-orange-400/70">substations</div>
          )}
        </div>
      </div>

      {/* Nearest Incident */}
      <div className="flex-1 flex items-center gap-3 px-4 bg-[#111827]">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.nearestIncidentKm !== null && kpi.nearestIncidentKm < 5 ? 'bg-red-500/15' : 'bg-slate-700/30'}`}>
          <Radar size={20} className={kpi.nearestIncidentKm !== null && kpi.nearestIncidentKm < 5 ? 'text-red-400' : 'text-slate-500'} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Nearest Incident</div>
          <div className={`text-2xl font-bold tabular-nums leading-tight ${kpi.nearestIncidentKm !== null && kpi.nearestIncidentKm < 5 ? 'text-red-400' : 'text-slate-300'}`}>
            {kpi.nearestIncidentKm !== null ? `${kpi.nearestIncidentKm}` : '-'}
          </div>
          {kpi.nearestIncidentKm !== null && (
            <div className="text-[10px] text-slate-500">km from infrastructure</div>
          )}
        </div>
      </div>

      {/* Live Feed Status */}
      <div className="flex-1 flex items-center gap-3 px-4 bg-[#111827]">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${kpi.isConnected ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
          <Radio size={20} className={isStale ? 'text-yellow-400' : kpi.isConnected ? 'text-green-400' : 'text-red-400'} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Live Feed</div>
          <div className={`text-sm font-bold leading-tight ${isStale ? 'text-yellow-400' : kpi.isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {kpi.isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="text-[10px] text-slate-500">{updatedText}</div>
        </div>
      </div>
    </div>
  )
}
