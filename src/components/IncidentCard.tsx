import {
  Flame, Building2, CloudLightning, Waves, Car,
  LifeBuoy, HeartPulse, BellRing, AlertTriangle, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Incident, ProximityAlert } from '@/lib/types'
import { INCIDENT_META, DEFAULT_META } from '@/lib/incidentMeta'

const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Building2, CloudLightning, Waves, Car,
  LifeBuoy, HeartPulse, BellRing, AlertTriangle,
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
  onSelect: (incident: Incident) => void
}

export function IncidentCard({ incident, alert, onSelect }: IncidentCardProps) {
  const meta = INCIDENT_META[incident.type] ?? DEFAULT_META
  const Icon = ICON_MAP[meta.icon] ?? AlertTriangle
  const badgeClass = STATUS_BADGE[incident.status] ?? STATUS_BADGE['Not Applicable']

  const timeAgo = (() => {
    const diff = Date.now() - new Date(incident.updatedAt).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  })()

  return (
    <button
      onClick={() => onSelect(incident)}
      className={`w-full text-left rounded-lg border p-3 mb-2 cursor-pointer transition-all duration-150 hover:brightness-125 active:scale-[0.98] ${meta.tailwindBorder} ${meta.tailwindBg}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <Icon size={14} color={meta.hex} strokeWidth={2.5} />
          <span className={`text-xs font-bold uppercase tracking-wide ${meta.tailwindText}`}>{incident.type}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${badgeClass}`}>
          {incident.status}
        </span>
      </div>

      <div className="text-sm font-semibold text-slate-100 mb-0.5 leading-snug">
        {incident.title}
      </div>

      {incident.location ? (
        <div className="text-xs text-slate-300 mb-1 truncate">{incident.location}</div>
      ) : null}

      {alert && (
        <div className="flex items-center gap-1 text-xs text-orange-300 font-medium mb-1">
          <Zap size={11} strokeWidth={2.5} />
          {alert.distanceKm.toFixed(1)}km from {alert.substation.name}
        </div>
      )}

      <div className="flex justify-between items-center mt-1.5 border-t border-white/5 pt-1.5">
        <span className="text-[10px] text-slate-400 font-mono">{incident.source}</span>
        <span className="text-[10px] text-slate-400">{timeAgo}</span>
      </div>
    </button>
  )
}
