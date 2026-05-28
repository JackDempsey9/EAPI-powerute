'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Zap } from 'lucide-react'
import {
  Flame, Building2, CloudLightning, Waves, TriangleAlert,
  LifeBuoy, Cross, BellRing, TreeDeciduous, CircleHelp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProximityAlert } from '@/lib/types'
import { INCIDENT_META, DEFAULT_META } from '@/lib/incidentMeta'

const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Building2, CloudLightning, Waves, TriangleAlert,
  LifeBuoy, Cross, BellRing, TreeDeciduous, CircleHelp,
}

const DISMISS_MS = 5_000

interface ActiveWarning {
  key: string
  alert: ProximityAlert
  expiresAt: number
}

interface ProximityWarningsProps {
  proximityAlerts: ProximityAlert[]
  onSelectIncident: (incident: ProximityAlert['incident']) => void
}

export function ProximityWarnings({ proximityAlerts, onSelectIncident }: ProximityWarningsProps) {
  const knownRef = useRef<Set<string>>(new Set())
  const [warnings, setWarnings] = useState<ActiveWarning[]>([])

  useEffect(() => {
    const now = Date.now()
    const newWarnings: ActiveWarning[] = []

    for (const alert of proximityAlerts) {
      const key = `${alert.incident.id}::${alert.substation.id}`
      if (!knownRef.current.has(key)) {
        knownRef.current.add(key)
        newWarnings.push({ key, alert, expiresAt: now + DISMISS_MS })
      }
    }

    if (newWarnings.length > 0) {
      setWarnings((prev) => [...newWarnings, ...prev])
    }
  }, [proximityAlerts])

  useEffect(() => {
    if (warnings.length === 0) return
    const nextExpiry = Math.min(...warnings.map((w) => w.expiresAt))
    const delay = Math.max(nextExpiry - Date.now(), 50)
    const timer = setTimeout(() => {
      const now = Date.now()
      setWarnings((prev) => prev.filter((w) => w.expiresAt > now))
    }, delay)
    return () => clearTimeout(timer)
  }, [warnings])

  const dismiss = useCallback((key: string) => {
    setWarnings((prev) => prev.filter((w) => w.key !== key))
  }, [])

  if (warnings.length === 0) return null

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none max-w-sm w-full px-4">
      {warnings.slice(0, 3).map((w) => {
        const meta = INCIDENT_META[w.alert.incident.type] ?? DEFAULT_META
        const Icon = ICON_MAP[meta.icon] ?? CircleHelp

        return (
          <div
            key={w.key}
            className="pointer-events-auto w-full border border-amber-700/60 bg-[#142420ee] cursor-pointer hover:border-amber-600 transition-colors"
            style={{ animation: 'slideDown 250ms ease-out' }}
            onClick={() => { onSelectIncident(w.alert.incident); dismiss(w.key) }}
          >
            <div className="flex items-start gap-3 p-3 overflow-hidden">
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <Zap size={14} className="text-orange-400" />
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-amber-400 mb-1 font-mono">
                  INFRASTRUCTURE WARNING
                </div>

                <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                  <Icon size={11} color={meta.hex} strokeWidth={2.5} className="shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-100 truncate">
                    {w.alert.incident.title}
                  </span>
                </div>

                <div className="text-[10px] text-slate-300 truncate">
                  {w.alert.distanceKm.toFixed(1)} km from <span className="font-medium text-slate-100">{w.alert.substation.name}</span>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); dismiss(w.key) }}
                className="shrink-0 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer p-0.5"
                aria-label="Dismiss warning"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
