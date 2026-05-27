import type { Incident, ProximityAlert } from '@/lib/types'
import { IncidentCard } from './IncidentCard'
import { StatusDot } from './StatusDot'

interface IncidentFeedProps {
  incidents: Incident[]
  proximityAlerts: ProximityAlert[]
  isConnected: boolean
  error: string | null
}

export function IncidentFeed({ incidents, proximityAlerts, isConnected, error }: IncidentFeedProps) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Live Incidents
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {incidents.length} active · sorted by proximity
          </div>
        </div>
        <StatusDot isConnected={isConnected} />
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-3 mt-3 p-2 rounded bg-red-950 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && incidents.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 px-6 text-center">
          <div className="text-3xl mb-3">✓</div>
          <div className="text-sm font-medium text-slate-400">No active incidents</div>
          <div className="text-xs mt-1">All clear across SA</div>
        </div>
      )}

      {/* Incident list */}
      {sorted.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0">
          {sorted.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              alert={alertMap.get(incident.id)}
            />
          ))}
        </div>
      )}

      {/* Footer attribution */}
      <div className="flex-shrink-0 border-t border-slate-700/50 px-4 py-2">
        <div className="text-[9px] text-slate-600 text-center">
          Data: emergencyapi.com · CFS · SES · MFS
        </div>
      </div>
    </div>
  )
}
