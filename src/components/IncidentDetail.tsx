'use client'

import {
  Flame, Building2, CloudLightning, Waves, Car,
  LifeBuoy, HeartPulse, BellRing, AlertTriangle, Zap,
  ArrowLeft, MapPin, Clock, Shield, ExternalLink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Incident, ProximityAlert } from '@/lib/types'
import { INCIDENT_META, DEFAULT_META } from '@/lib/incidentMeta'

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return iso
  }
}

function relativeTime(iso: string | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2">
      {children}
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  if (value === null || value === undefined || value === '' || value === '-') return null
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-slate-700/30 last:border-0">
      <span className="text-[10px] text-slate-500 shrink-0 pt-px">{label}</span>
      <span className={`text-xs text-right leading-snug ${accent ? 'text-orange-300 font-medium' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  )
}

// ── Status badge colours ─────────────────────────────────────────────────────

const STATUS_COLOURS: Record<string, string> = {
  'Emergency Warning': 'bg-red-900/80 text-red-300 border border-red-700',
  'Watch and Act':     'bg-orange-900/80 text-orange-300 border border-orange-700',
  'Advice':            'bg-yellow-900/80 text-yellow-300 border border-yellow-700',
  'Information':       'bg-slate-800 text-slate-300 border border-slate-600',
  'Not Applicable':    'bg-slate-800 text-slate-400 border border-slate-700',
}

const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Building2, CloudLightning, Waves, Car,
  LifeBuoy, HeartPulse, BellRing, AlertTriangle,
}

// ── Main component ───────────────────────────────────────────────────────────

interface IncidentDetailProps {
  incident: Incident
  alert?: ProximityAlert
  onClose: () => void
}

export function IncidentDetail({ incident, alert, onClose }: IncidentDetailProps) {
  const meta = INCIDENT_META[incident.type] ?? DEFAULT_META
  const Icon = ICON_MAP[meta.icon] ?? AlertTriangle
  const color = meta.hex
  const badgeClass = STATUS_COLOURS[incident.status] ?? STATUS_COLOURS['Not Applicable']

  const mapsUrl = `https://maps.google.com/maps?q=${incident.coordinates[1]},${incident.coordinates[0]}`
  const coordLabel = `${incident.coordinates[1].toFixed(4)}°, ${incident.coordinates[0].toFixed(4)}°`

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 flex-shrink-0">
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium flex items-center gap-1 shrink-0 cursor-pointer"
          aria-label="Back to incidents"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-auto">Incident Detail</span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Hero section */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2 mb-2" style={{ color }}>
            <Icon size={18} strokeWidth={2.5} />
            <span className="text-xs font-bold uppercase tracking-wider">{incident.type}</span>
          </div>
          <div className="text-sm font-semibold text-slate-100 leading-snug mb-3">
            {incident.title}
          </div>
          <span className={`text-[10px] px-2 py-1 rounded font-medium ${badgeClass}`}>
            {incident.status}
          </span>
        </div>

        {/* Location */}
        <div className="px-4 py-3 border-b border-slate-700/50">
          <SectionHeading>
            <span className="inline-flex items-center gap-1">
              <MapPin size={10} /> Location
            </span>
          </SectionHeading>
          <Row label="Address"  value={incident.location || '-'} />
          {incident.suburb && incident.suburb !== incident.location && (
            <Row label="Suburb" value={`${incident.suburb}, ${incident.state}`} />
          )}
          {!incident.suburb && (
            <Row label="State" value={incident.state} />
          )}
          <Row
            label="Coordinates"
            value={
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                {coordLabel} <ExternalLink size={10} />
              </a>
            }
          />
        </div>

        {/* Response */}
        <div className="px-4 py-3 border-b border-slate-700/50">
          <SectionHeading>
            <span className="inline-flex items-center gap-1">
              <Shield size={10} /> Response
            </span>
          </SectionHeading>
          <Row label="Agency"     value={incident.source} />
          {incident.feedId && <Row label="Feed"       value={incident.feedId} />}
          {incident.severity  && <Row label="Severity"   value={incident.severity} />}
          {incident.urgency   && <Row label="Urgency"    value={incident.urgency} />}
          {incident.certainty && <Row label="Certainty"  value={incident.certainty} />}
          {typeof incident.resources === 'number' && incident.resources > 0 && (
            <Row label="Resources" value={`${incident.resources} unit${incident.resources !== 1 ? 's' : ''}`} />
          )}
          {typeof incident.aircraft === 'number' && incident.aircraft > 0 && (
            <Row label="Aircraft" value={`${incident.aircraft} aircraft`} accent />
          )}
        </div>

        {/* Infrastructure risk */}
        {alert && (
          <div className="px-4 py-3 border-b border-slate-700/50">
            <SectionHeading>
              <span className="inline-flex items-center gap-1">
                <Zap size={10} /> Infrastructure Risk
              </span>
            </SectionHeading>
            <div className="flex items-start gap-2 py-1">
              <Zap size={14} className="text-orange-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-slate-200 font-medium">{alert.substation.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {alert.distanceKm.toFixed(2)} km from this incident
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="px-4 py-3 border-b border-slate-700/50">
          <SectionHeading>
            <span className="inline-flex items-center gap-1">
              <Clock size={10} /> Timeline
            </span>
          </SectionHeading>
          {incident.reportedAt && (
            <Row label="Reported"  value={formatDateTime(incident.reportedAt)} />
          )}
          <Row label="Updated"   value={formatDateTime(incident.updatedAt)} />
          <div className="text-[10px] text-slate-500 mt-1.5 text-right">
            {relativeTime(incident.updatedAt)}
          </div>
        </div>

        {/* Classification */}
        <div className="px-4 py-3 border-b border-slate-700/50">
          <SectionHeading>Classification</SectionHeading>
          <Row label="Event type"  value={incident.type} />
          <Row label="CAP status"  value={incident.status} />
          <Row label="State"       value={incident.state} />
        </div>

        {/* Source link */}
        {incident.link && (
          <div className="px-4 py-3">
            <a
              href={incident.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-md border border-slate-600 text-xs text-slate-300 hover:text-slate-100 hover:border-slate-400 transition-colors cursor-pointer"
            >
              View official source <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Powered by */}
        <div className="px-4 pb-4 pt-1">
          <div className="text-[9px] text-slate-600 text-center">
            Data via emergencyapi.com | {incident.feedId ?? incident.source}
          </div>
        </div>

      </div>
    </div>
  )
}
