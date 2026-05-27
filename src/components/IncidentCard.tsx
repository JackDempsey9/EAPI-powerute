import type { Incident, ProximityAlert } from '@/lib/types'

const TYPE_COLOURS: Record<string, string> = {
  Bushfire: 'text-red-400 border-red-800 bg-red-950/50',
  Storm:    'text-orange-400 border-orange-800 bg-orange-950/30',
  Flood:    'text-yellow-400 border-yellow-800 bg-yellow-950/30',
  Accident: 'text-blue-400 border-blue-800 bg-blue-950/30',
  Rescue:   'text-purple-400 border-purple-800 bg-purple-950/30',
  Other:    'text-slate-400 border-slate-700 bg-slate-900/50',
}

const TYPE_ICONS: Record<string, string> = {
  Bushfire: '🔥',
  Storm:    '⚡',
  Flood:    '🌊',
  Accident: '🚗',
  Rescue:   '🚁',
  Other:    '⚠️',
}

const STATUS_BADGE: Record<string, string> = {
  'Emergency Warning': 'bg-red-900 text-red-300 border border-red-700',
  'Watch and Act':     'bg-orange-900 text-orange-300 border border-orange-700',
  'Advice':            'bg-yellow-900 text-yellow-300 border border-yellow-700',
  'Information':       'bg-slate-800 text-slate-400 border border-slate-600',
  'Not Applicable':    'bg-slate-800 text-slate-500 border border-slate-700',
}

interface IncidentCardProps {
  incident: Incident
  alert?: ProximityAlert
}

export function IncidentCard({ incident, alert }: IncidentCardProps) {
  const colourClass = TYPE_COLOURS[incident.type] ?? TYPE_COLOURS.Other
  const icon = TYPE_ICONS[incident.type] ?? '⚠️'
  const badgeClass = STATUS_BADGE[incident.status] ?? STATUS_BADGE['Not Applicable']

  const timeAgo = (() => {
    const diff = Date.now() - new Date(incident.updatedAt).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  })()

  return (
    <div className={`rounded-lg border p-3 mb-2 ${colourClass}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{icon}</span>
          <span className="text-xs font-bold uppercase tracking-wide">{incident.type}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badgeClass}`}>
          {incident.status}
        </span>
      </div>

      <div className="text-sm font-semibold text-slate-200 mb-0.5 leading-snug">
        {incident.title}
      </div>

      {alert && (
        <div className="text-xs text-orange-400 font-medium mb-1">
          ⚡ {alert.distanceKm.toFixed(1)}km from {alert.substation.name}
        </div>
      )}

      <div className="flex justify-between items-center mt-1.5">
        <span className="text-[10px] text-slate-500 font-mono">{incident.source}</span>
        <span className="text-[10px] text-slate-500">{timeAgo}</span>
      </div>
    </div>
  )
}
