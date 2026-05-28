'use client'

import { useState } from 'react'
import type { Incident, ProximityAlert } from '@/lib/types'
import { IncidentCard } from './IncidentCard'

interface IncidentFeedProps {
  incidents: Incident[]
  proximityAlerts: ProximityAlert[]
  isConnected: boolean
  error: string | null
  onSelectIncident: (incident: Incident) => void
}

export function IncidentFeed({ incidents, proximityAlerts, isConnected, error, onSelectIncident }: IncidentFeedProps) {
  const [search, setSearch] = useState('')

  // Build lookup: incidentId → alert
  const alertMap = new Map(proximityAlerts.map((a) => [a.incident.id, a]))

  // Sort: proximity alerts first (by distance), then by severity, then by time
  const statusOrder: Record<string, number> = {
    'Emergency Warning': 0,
    'Watch and Act': 1,
    'Advice': 2,
    'Information': 3,
    'Not Applicable': 4,
  }

  const sorted = [...incidents].sort((a, b) => {
    const alertA = alertMap.get(a.id)
    const alertB = alertMap.get(b.id)
    if (alertA && !alertB) return -1
    if (!alertA && alertB) return 1
    if (alertA && alertB) return alertA.distanceKm - alertB.distanceKm
    return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
  })

  // Filter by search query , matches type, title, location, source
  const q = search.trim().toLowerCase()
  const filtered = q
    ? sorted.filter(
        (inc) =>
          inc.type.toLowerCase().includes(q) ||
          inc.title.toLowerCase().includes(q) ||
          inc.location.toLowerCase().includes(q) ||
          inc.source.toLowerCase().includes(q)
      )
    : sorted

  const countLabel = q
    ? `${filtered.length} of ${incidents.length} | filtered`
    : `${incidents.length} active | sorted by proximity`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Live Incidents
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {countLabel}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-2 pb-2 border-b border-slate-700/50 flex-shrink-0">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents…"
            className="w-full bg-[#0a0f1a] border border-slate-700 rounded-md pl-7 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-base leading-none transition-colors"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-3 mt-3 p-2 rounded bg-red-950 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Empty / no results state */}
      {!error && filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {q ? (
            <>
              <div className="text-sm font-medium text-slate-300">No matches found</div>
              <div className="text-xs mt-1 text-slate-400">Try a different search term</div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-slate-300">No active incidents</div>
              <div className="text-xs mt-1 text-slate-400">All clear across SA</div>
            </>
          )}
        </div>
      )}

      {/* Incident list */}
      {filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {filtered.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              alert={alertMap.get(incident.id)}
              onSelect={onSelectIncident}
            />
          ))}
        </div>
      )}

      {/* Footer attribution */}
      <div className="flex-shrink-0 border-t border-slate-700/50 px-4 py-2">
        <div className="text-[9px] text-slate-400 text-center">
          Data: emergencyapi.com | CFS | MFS | SES | SAAS | EMV | QFD | TFS | RFS
        </div>
      </div>
    </div>
  )
}
