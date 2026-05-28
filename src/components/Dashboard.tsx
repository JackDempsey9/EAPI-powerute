'use client'

import { useMemo, useState, useCallback } from 'react'
import { Settings } from 'lucide-react'
import { useEmergencyFeed } from '@/hooks/useEmergencyFeed'
import { useSubstations } from '@/hooks/useSubstations'
import { useOutages } from '@/hooks/useOutages'
import { useGenerationMix } from '@/hooks/useGenerationMix'
import { useFeederData } from '@/hooks/useFeederData'
import { findProximityAlerts, getKPIData, PROXIMITY_THRESHOLDS } from '@/lib/proximity'
import { detectFeederImpacts } from '@/lib/feederImpact'
import type { Incident, ProximityAlert, DashboardSettings } from '@/lib/types'
import { ALL_INCIDENT_TYPES } from '@/lib/types'
import { KPIStrip } from './KPIStrip'
import { DashboardMap } from './DashboardMap'
import { IncidentFeed } from './IncidentFeed'
import { IncidentDetail } from './IncidentDetail'
import { ProximityWarnings } from './ProximityWarnings'
import { GenerationMix } from './GenerationMix'
import { SettingsPanel } from './SettingsPanel'

function buildDefaultSettings(): DashboardSettings {
  const visibleTypes: Record<string, boolean> = {}
  const notifyWhenHidden: Record<string, boolean> = {}
  const customRadii: Record<string, number> = {}
  for (const type of ALL_INCIDENT_TYPES) {
    visibleTypes[type] = true
    notifyWhenHidden[type] = true
    customRadii[type] = PROXIMITY_THRESHOLDS[type] ?? 0.15
  }
  return {
    visibleTypes,
    notifyWhenHidden,
    customRadii,
    showSubstations: true,
    showTransmissionLines: true,
    showSAPNLines: true,
    showDistributionFeeders: true,
    showLVNetwork: true,
    showPoles: true,
    showDepots: true,
    showOutages: true,
    showProximityRings: false,
    showLineAnimation: false,
    showGenerationMix: true,
  }
}

export function Dashboard() {
  const feed = useEmergencyFeed()
  const infrastructure = useSubstations()
  const outageData = useOutages()
  const generation = useGenerationMix()
  const feederData = useFeederData()

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [settings, setSettings] = useState<DashboardSettings>(buildDefaultSettings)
  const [showSettings, setShowSettings] = useState(false)

  const handleSelectIncident = useCallback((incident: Incident) => {
    setSelectedIncident(incident)
  }, [])

  // Proximity alerts use custom radii from settings
  const proximityAlerts = useMemo(() => {
    if (!feed.incidents.length || !infrastructure.substations.length) return []
    const allAlerts: ProximityAlert[] = []
    for (const type of ALL_INCIDENT_TYPES) {
      const radius = settings.customRadii[type]
      if (!radius || radius <= 0) continue
      const typeIncidents = feed.incidents.filter((i) => i.type === type)
      if (typeIncidents.length > 0) {
        allAlerts.push(...findProximityAlerts(typeIncidents, infrastructure.substations, radius))
      }
    }
    return allAlerts
  }, [feed.incidents, infrastructure.substations, settings.customRadii])

  // Proximity alerts filtered to only types that should notify
  const notifiableAlerts = useMemo(() => {
    return proximityAlerts.filter((a) => {
      const visible = settings.visibleTypes[a.incident.type] !== false
      if (visible) return true
      return settings.notifyWhenHidden[a.incident.type] !== false
    })
  }, [proximityAlerts, settings.visibleTypes, settings.notifyWhenHidden])

  // Visible incidents (filtered by settings)
  const visibleIncidents = useMemo(() => {
    return feed.incidents.filter((i) => settings.visibleTypes[i.type] !== false)
  }, [feed.incidents, settings.visibleTypes])

  // Visible proximity alerts (only for visible types)
  const visibleAlerts = useMemo(() => {
    return proximityAlerts.filter((a) => settings.visibleTypes[a.incident.type] !== false)
  }, [proximityAlerts, settings.visibleTypes])

  const feederImpacts = useMemo(
    () => detectFeederImpacts(feed.incidents, feederData),
    [feed.incidents, feederData]
  )

  const kpi = useMemo(
    () => getKPIData(feed.incidents, proximityAlerts, feed.lastUpdated),
    [feed.incidents, proximityAlerts, feed.lastUpdated]
  )

  return (
    <div className="flex flex-col h-screen bg-[#0a100e] text-[#c8e6d0]">
      <KPIStrip kpi={kpi} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <DashboardMap
            incidents={visibleIncidents}
            substations={settings.showSubstations ? infrastructure.substations : []}
            transmissionLines={infrastructure.transmissionLines}
            outages={outageData.outages}
            proximityAlerts={visibleAlerts}
            selectedIncident={selectedIncident}
            settings={settings}
            onSelectIncident={handleSelectIncident}
          />
          <ProximityWarnings
            proximityAlerts={notifiableAlerts}
            onSelectIncident={handleSelectIncident}
          />
          {settings.showGenerationMix && <GenerationMix data={generation} />}

          {/* Settings toggle button */}
          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`absolute top-2 left-2 z-20 w-8 h-8 flex items-center justify-center transition-colors cursor-pointer border ${showSettings ? 'bg-[#1e3530] border-[#2a4540] text-white' : 'bg-[#0f1a16] border-[#1e3530] text-[#5a7a65] hover:text-[#c8e6d0]'}`}
            aria-label="Toggle settings"
          >
            <Settings size={14} />
          </button>

          {showSettings && (
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>

        <div className="w-80 flex-shrink-0 border-l border-[#1e3530] overflow-hidden flex flex-col bg-[#0f1a16]">
          {selectedIncident ? (
            <IncidentDetail
              incident={selectedIncident}
              alert={proximityAlerts.find((a) => a.incident.id === selectedIncident.id)}
              feederImpact={feederImpacts.find((f) => f.incident.id === selectedIncident.id)}
              onClose={() => setSelectedIncident(null)}
            />
          ) : (
            <IncidentFeed
              incidents={visibleIncidents}
              proximityAlerts={visibleAlerts}
              feederImpacts={feederImpacts}
              outages={outageData.outages}
              isConnected={feed.isConnected}
              error={feed.error}
              onSelectIncident={handleSelectIncident}
            />
          )}
        </div>
      </div>
    </div>
  )
}
