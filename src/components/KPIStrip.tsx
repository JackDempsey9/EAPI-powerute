import { useState, useEffect } from 'react'
import type { KPIData } from '@/lib/types'
import { StatusDot } from './StatusDot'

const FIRE_DANGER_COLOUR: Record<KPIData['fireDangerLevel'], string> = {
  Catastrophic: 'text-red-400 border-red-500',
  Extreme:      'text-orange-400 border-orange-500',
  High:         'text-yellow-400 border-yellow-500',
  Moderate:     'text-green-400 border-green-500',
  None:         'text-slate-400 border-slate-600',
}

interface KPITileProps {
  label: string
  value: string
  accentClass: string
  sub?: string
}

function KPITile({ label, value, accentClass, sub }: KPITileProps) {
  return (
    <div className={`flex-1 flex flex-col justify-center px-4 py-2 border-t-2 bg-[#1e2533] ${accentClass}`}>
      <div className="text-[0.6rem] uppercase tracking-widest text-slate-400 mb-0.5">{label}</div>
      <div className={`text-xl font-bold leading-none ${accentClass.includes('orange') ? 'text-orange-400' : accentClass.includes('red') ? 'text-red-400' : accentClass.includes('yellow') ? 'text-yellow-400' : accentClass.includes('green') ? 'text-green-400' : 'text-slate-300'}`}>
        {value}
      </div>
      {sub && <div className="text-[0.6rem] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

interface KPIStripProps {
  kpi: KPIData
}

export function KPIStrip({ kpi }: KPIStripProps) {
  // Tick every second to keep the "Xs ago" counter accurate
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

  return (
    <div className="flex h-16 border-b border-slate-700/50 gap-px bg-slate-700/20 flex-shrink-0">
      <KPITile
        label="Active Incidents"
        value={String(kpi.activeIncidents)}
        accentClass={kpi.activeIncidents > 0 ? 'border-red-500' : 'border-slate-600'}
      />
      <KPITile
        label="Fire Danger"
        value={kpi.fireDangerLevel}
        accentClass={FIRE_DANGER_COLOUR[kpi.fireDangerLevel]}
      />
      <KPITile
        label="Assets at Risk"
        value={String(kpi.assetsAtRisk)}
        accentClass={kpi.assetsAtRisk > 0 ? 'border-orange-500' : 'border-slate-600'}
      />
      <KPITile
        label="Nearest Incident"
        value={kpi.nearestIncidentKm !== null ? `${kpi.nearestIncidentKm} km` : '—'}
        accentClass={kpi.nearestIncidentKm !== null && kpi.nearestIncidentKm < 5 ? 'border-red-500' : 'border-slate-600'}
        sub={kpi.nearestIncidentKm !== null ? 'from infrastructure' : ''}
      />
      <div className="flex-1 flex flex-col justify-center px-4 py-2 border-t-2 border-slate-600 bg-[#1e2533]">
        <div className="text-[0.6rem] uppercase tracking-widest text-slate-400 mb-0.5">Live Feed</div>
        <div className="flex items-center gap-2">
          <StatusDot isConnected={kpi.isConnected} isStale={isStale} />
          <span className={`text-sm font-medium ${isStale ? 'text-yellow-400' : kpi.isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {updatedText}
          </span>
        </div>
      </div>
    </div>
  )
}
