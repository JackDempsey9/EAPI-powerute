'use client'

import { X, Eye, EyeOff, Bell, BellOff, Layers } from 'lucide-react'
import {
  Flame, Building2, CloudLightning, Waves, TriangleAlert,
  LifeBuoy, Cross, BellRing, TreeDeciduous, CircleHelp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardSettings } from '@/lib/types'
import { ALL_INCIDENT_TYPES } from '@/lib/types'
import { INCIDENT_META, DEFAULT_META } from '@/lib/incidentMeta'

const ICON_MAP: Record<string, LucideIcon> = {
  Flame, Building2, CloudLightning, Waves, TriangleAlert,
  LifeBuoy, Cross, BellRing, TreeDeciduous, CircleHelp,
}

interface SettingsPanelProps {
  settings: DashboardSettings
  onChange: (settings: DashboardSettings) => void
  onClose: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2 mt-4 first:mt-0">
      {children}
    </div>
  )
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      onClick={onToggle}
      className="cursor-pointer shrink-0"
      aria-label={label}
    >
      <div className={`w-8 h-[18px] rounded-full relative transition-colors ${on ? 'bg-blue-600' : 'bg-slate-700'}`}>
        <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${on ? 'left-[14px]' : 'left-[2px]'}`} />
      </div>
    </button>
  )
}

export function SettingsPanel({ settings, onChange, onClose }: SettingsPanelProps) {
  function setType<K extends 'visibleTypes' | 'notifyWhenHidden'>(
    field: K, type: string, value: boolean
  ) {
    onChange({ ...settings, [field]: { ...settings[field], [type]: value } })
  }

  function setRadius(type: string, km: number) {
    onChange({ ...settings, customRadii: { ...settings.customRadii, [type]: km } })
  }

  function setFlag(key: keyof DashboardSettings, value: boolean) {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center pt-4 pointer-events-none">
      <div
        className="pointer-events-auto w-[420px] max-h-[calc(100%-32px)] bg-[#111827] border border-slate-700/60 rounded-lg shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
        style={{ animation: 'slideDown 200ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Layer Settings</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer p-1"
            aria-label="Close settings"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">

          <SectionLabel>Incident Types</SectionLabel>
          <div className="text-[10px] text-slate-500 mb-3">
            Toggle visibility on the map and feed. Notifications can still fire for hidden types.
          </div>

          <div className="space-y-1.5">
            {ALL_INCIDENT_TYPES.map((type) => {
              const meta = INCIDENT_META[type] ?? DEFAULT_META
              const Icon = ICON_MAP[meta.icon] ?? CircleHelp
              const visible = settings.visibleTypes[type] !== false
              const notify = settings.notifyWhenHidden[type] !== false

              return (
                <div key={type} className="rounded-md border border-slate-700/40 bg-[#0d1117] p-2.5">
                  {/* Row 1: type name + visibility toggle */}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={12} color={meta.hex} strokeWidth={2.5} />
                    <span className="text-[11px] font-semibold text-slate-200 flex-1">{type}</span>
                    <div className="flex items-center gap-1.5">
                      {visible
                        ? <Eye size={11} className="text-slate-500" />
                        : <EyeOff size={11} className="text-slate-600" />
                      }
                      <Toggle on={visible} onToggle={() => setType('visibleTypes', type, !visible)} label={`Toggle ${type} visibility`} />
                    </div>
                  </div>

                  {/* Row 2: radius + notify when hidden */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-[10px] text-slate-500">Radius</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        step={0.05}
                        value={settings.customRadii[type] ?? 0}
                        onChange={(e) => setRadius(type, Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-16 bg-[#1a1f2e] border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-slate-200 tabular-nums text-right focus:outline-none focus:border-slate-500"
                      />
                      <span className="text-[10px] text-slate-500">km</span>
                    </div>

                    {!visible && (
                      <div className="flex items-center gap-1.5">
                        {notify
                          ? <Bell size={10} className="text-orange-400" />
                          : <BellOff size={10} className="text-slate-600" />
                        }
                        <Toggle
                          on={notify}
                          onToggle={() => setType('notifyWhenHidden', type, !notify)}
                          label={`Toggle ${type} notifications when hidden`}
                        />
                        <span className="text-[9px] text-slate-500">Notify</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <SectionLabel>Infrastructure Layers</SectionLabel>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] text-slate-300">Zone Substations</span>
              </div>
              <Toggle on={settings.showSubstations} onToggle={() => setFlag('showSubstations', !settings.showSubstations)} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded bg-blue-400" />
                <span className="text-[11px] text-slate-300">ElectraNet Transmission (132-275kV)</span>
              </div>
              <Toggle on={settings.showTransmissionLines} onToggle={() => setFlag('showTransmissionLines', !settings.showTransmissionLines)} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded bg-amber-400" />
                <span className="text-[11px] text-slate-300">SAPN Sub-Transmission (66kV)</span>
              </div>
              <Toggle on={settings.showSAPNLines} onToggle={() => setFlag('showSAPNLines', !settings.showSAPNLines)} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded bg-gray-400" />
                <span className="text-[11px] text-slate-300">SAPN Distribution (11kV/19kV)</span>
              </div>
              <Toggle on={settings.showDistributionFeeders !== false} onToggle={() => setFlag('showDistributionFeeders', !(settings.showDistributionFeeders !== false))} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded bg-slate-500" />
                <span className="text-[11px] text-slate-300">LV Network 433V/240V (zoom 15+)</span>
              </div>
              <Toggle on={settings.showLVNetwork !== false} onToggle={() => setFlag('showLVNetwork', !(settings.showLVNetwork !== false))} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span className="text-[11px] text-slate-300">Poles (zoom 16+)</span>
              </div>
              <Toggle on={settings.showPoles !== false} onToggle={() => setFlag('showPoles', !(settings.showPoles !== false))} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded bg-cyan-400" />
                <span className="text-[11px] text-slate-300">Crew Depots</span>
              </div>
              <Toggle on={settings.showDepots !== false} onToggle={() => setFlag('showDepots', !(settings.showDepots !== false))} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500" />
                <span className="text-[11px] text-slate-300">Outage Zones</span>
              </div>
              <Toggle on={settings.showOutages !== false} onToggle={() => setFlag('showOutages', !(settings.showOutages !== false))} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-dashed border-orange-400" />
                <span className="text-[11px] text-slate-300">Proximity Rings</span>
              </div>
              <Toggle on={settings.showProximityRings} onToggle={() => setFlag('showProximityRings', !settings.showProximityRings)} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 rounded bg-blue-400 opacity-60" />
                <span className="text-[11px] text-slate-300">Line Flow Animation</span>
              </div>
              <Toggle on={settings.showLineAnimation} onToggle={() => setFlag('showLineAnimation', !settings.showLineAnimation)} />
            </div>
          </div>

          <SectionLabel>Overlays</SectionLabel>

          <div className="flex items-center justify-between py-1 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[11px] text-slate-300">SA Generation Mix</span>
            </div>
            <Toggle on={settings.showGenerationMix} onToggle={() => setFlag('showGenerationMix', !settings.showGenerationMix)} />
          </div>

        </div>
      </div>
    </div>
  )
}
