import {
  Flame, Building2, CloudLightning, Waves, TriangleAlert,
  LifeBuoy, Cross, BellRing, TreeDeciduous, CircleHelp, Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Incident, ProximityAlert } from '@/lib/types'
import type { FeederImpact } from '@/lib/feederImpact'
import { INCIDENT_META, DEFAULT_META } from '@/lib/incidentMeta'

const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Building2, CloudLightning, Waves, TriangleAlert,
  LifeBuoy, Cross, BellRing, TreeDeciduous, CircleHelp,
}

const STATUS_BADGE: Record<string, string> = {
  'Emergency Warning': 'text-red-400 border-red-700',
  'Watch and Act':     'text-amber-400 border-amber-700',
  'Advice':            'text-yellow-400 border-yellow-700',
  'Information':       'text-[#5a7a65] border-[#2a4540]',
  'Not Applicable':    'text-[#3a5545] border-[#1e3530]',
}

interface IncidentCardProps {
  incident: Incident
  alert?: ProximityAlert
  feederImpact?: FeederImpact
  onSelect: (incident: Incident) => void
}

export function IncidentCard({ incident, alert, feederImpact, onSelect }: IncidentCardProps) {
  const meta = INCIDENT_META[incident.type] ?? DEFAULT_META
  const Icon = ICON_MAP[meta.icon] ?? CircleHelp
  const badgeClass = STATUS_BADGE[incident.status] ?? STATUS_BADGE['Not Applicable']

  const timeAgo = (() => {
    const diff = Date.now() - new Date(incident.updatedAt).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return 'NOW'
    if (mins < 60) return `${mins}M`
    return `${Math.floor(mins / 60)}H`
  })()

  return (
    <button
      onClick={() => onSelect(incident)}
      className="w-full text-left border border-[#1e3530] p-2.5 mb-1 cursor-pointer transition-colors duration-100 hover:bg-[#142420] active:bg-[#1e3530] bg-[#0f1a16]"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <Icon size={12} color={meta.hex} strokeWidth={2.5} />
          <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${meta.tailwindText}`}>{incident.type}</span>
        </div>
        <span className={`text-[9px] px-1 py-px border font-mono uppercase tracking-wider ${badgeClass}`}>
          {incident.status}
        </span>
      </div>

      <div className="text-xs font-medium text-[#c8e6d0] mb-0.5 leading-snug">
        {incident.title}
      </div>

      {incident.location ? (
        <div className="text-[10px] text-[#7a9a85] mb-1 truncate font-mono">{incident.location}</div>
      ) : null}

      {feederImpact && (
        <div className="flex items-center gap-1 text-[10px] text-red-400 font-mono mb-1">
          <Zap size={10} strokeWidth={2.5} />
          FEEDER {feederImpact.feederId} | {feederImpact.distanceM}M | {feederImpact.voltage} {feederImpact.lineType.toUpperCase()}
        </div>
      )}

      {alert && (
        <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono mb-1">
          <Zap size={10} strokeWidth={2.5} />
          {alert.distanceKm.toFixed(1)}KM FROM {alert.substation.name.toUpperCase()}
        </div>
      )}

      <div className="flex justify-between items-center mt-1.5 border-t border-[#1e3530] pt-1.5">
        <span className="text-[9px] text-[#3a5545] font-mono">{incident.source}</span>
        <span className="text-[9px] text-[#3a5545] font-mono">{timeAgo}</span>
      </div>
    </button>
  )
}
