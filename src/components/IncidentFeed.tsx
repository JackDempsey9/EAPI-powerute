'use client'

import { useState } from 'react'
import { Search, X, Zap } from 'lucide-react'
import type { Incident, ProximityAlert, Outage } from '@/lib/types'
import type { FeederImpact } from '@/lib/feederImpact'
import { IncidentCard } from './IncidentCard'

interface IncidentFeedProps {
  incidents: Incident[]
  proximityAlerts: ProximityAlert[]
  feederImpacts: FeederImpact[]
  outages: Outage[]
  isConnected: boolean
  error: string | null
  onSelectIncident: (incident: Incident) => void
}

export function IncidentFeed({ incidents, proximityAlerts, feederImpacts, outages, isConnected, error, onSelectIncident }: IncidentFeedProps) {
  const [search, setSearch] = useState('')

  const alertMap = new Map(proximityAlerts.map((a) => [a.incident.id, a]))
  const feederMap = new Map(feederImpacts.map((f) => [f.incident.id, f]))

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
    ? `${filtered.length} OF ${incidents.length} | FILTERED`
    : `${incidents.length} ACTIVE | BY PROXIMITY`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e3530] flex-shrink-0">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#c8e6d0] font-mono">
            LIVE INCIDENTS
          </div>
          <div className="text-[9px] text-[#3a5545] font-mono mt-0.5">
            {countLabel}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[#1e3530] flex-shrink-0">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#3a5545] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH"
            className="w-full bg-[#0a100e] border border-[#1e3530] pl-7 pr-7 py-1.5 text-[10px] text-[#c8e6d0] placeholder:text-[#2a4540] focus:outline-none focus:border-[#2a4540] transition-colors font-mono uppercase"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5545] hover:text-[#7a9a85] transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-3 mt-2 p-2 border border-red-800 text-red-400 text-[10px] font-mono">
          {error}
        </div>
      )}

      {/* Outage summary */}
      {outages.length > 0 && (
        <div className="px-2 py-2 border-b border-[#1e3530] flex-shrink-0">
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#f97316] font-mono mb-1.5">
            NETWORK OUTAGES ({outages.length})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {outages.slice(0, 10).map((o) => {
              const totalCustomers = o.affectedCustomers ?? 0
              const suburbs = o.affectedSuburbs?.map((s) => s.name).join(', ') ?? ''
              return (
                <div key={o.id} className="flex items-start gap-1.5 text-[9px] font-mono">
                  <Zap size={9} className="text-[#f97316] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[#c8e6d0]">{o.status}</span>
                    {totalCustomers > 0 && <span className="text-[#5a7a65]"> | {totalCustomers} customers</span>}
                    {suburbs && <div className="text-[#3a5545] truncate">{suburbs}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!error && filtered.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-xs text-[#3a5545] font-mono">
            {q ? 'NO MATCHES' : 'NO ACTIVE INCIDENTS'}
          </div>
        </div>
      )}

      {/* Incident list */}
      {filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              alert={alertMap.get(incident.id)}
              feederImpact={feederMap.get(incident.id)}
              onSelect={onSelectIncident}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-[#1e3530] px-3 py-1.5">
        <div className="text-[8px] text-[#2a4540] text-center font-mono uppercase tracking-wider">
          emergencyapi.com | CFS | MFS | SES | SAAS
        </div>
      </div>
    </div>
  )
}
