'use client'

import { useMemo } from 'react'
import { useEmergencyFeed } from '@/hooks/useEmergencyFeed'
import { useSubstations } from '@/hooks/useSubstations'
import { useOutages } from '@/hooks/useOutages'
import { findProximityAlerts, getKPIData, PROXIMITY_THRESHOLDS } from '@/lib/proximity'
import { KPIStrip } from './KPIStrip'
import { DashboardMap } from './DashboardMap'
import { IncidentFeed } from './IncidentFeed'

export function Dashboard() {
  const feed = useEmergencyFeed()
  const infrastructure = useSubstations()
  const outageData = useOutages()

  const proximityAlerts = useMemo(() => {
    if (!feed.incidents.length || !infrastructure.substations.length) return []
    // Use bushfire threshold as default (conservative)
    return findProximityAlerts(
      feed.incidents,
      infrastructure.substations,
      PROXIMITY_THRESHOLDS.Bushfire
    )
  }, [feed.incidents, infrastructure.substations])

  const kpi = useMemo(
    () => getKPIData(feed.incidents, proximityAlerts, feed.lastUpdated),
    [feed.incidents, proximityAlerts, feed.lastUpdated]
  )

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1a] text-slate-100">
      {/* KPI Strip */}
      <KPIStrip kpi={kpi} />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map — takes ~75% width */}
        <div className="flex-1 relative">
          <DashboardMap
            incidents={feed.incidents}
            substations={infrastructure.substations}
            transmissionLines={infrastructure.transmissionLines}
            outages={outageData.outages}
            proximityAlerts={proximityAlerts}
          />
        </div>

        {/* Incident feed — fixed 320px right panel */}
        <div className="w-80 flex-shrink-0 border-l border-slate-700/50 overflow-hidden flex flex-col bg-[#111827]">
          <IncidentFeed
            incidents={feed.incidents}
            proximityAlerts={proximityAlerts}
            isConnected={feed.isConnected}
            error={feed.error}
          />
        </div>
      </div>
    </div>
  )
}
