// ─── Emergency Incidents (emergencyAPI.com) ────────────────────────────────

export type IncidentType =
  | 'Bushfire'
  | 'Structure Fire'
  | 'Storm'
  | 'Flood'
  | 'Accident'
  | 'Rescue'
  | 'Medical'
  | 'Alarm'
  | 'Other'

export type IncidentStatus =
  | 'Emergency Warning'
  | 'Watch and Act'
  | 'Advice'
  | 'Information'
  | 'Not Applicable'

export interface Incident {
  // Core (always present)
  id: string
  type: IncidentType
  status: IncidentStatus
  title: string
  location: string          // formatted address
  state: string
  source: string            // agency name (CFS, MFS, SAAS, etc.)
  updatedAt: string         // ISO 8601
  coordinates: [number, number]  // [lng, lat]

  // Extended (populated from API where available)
  suburb?: string           // location.suburb
  feedId?: string           // source.feedId (sa-cfs, sa-mfs, etc.)
  severity?: string         // Minor / Moderate / Severe / Extreme
  urgency?: string          // Immediate / Expected / Future / Past
  certainty?: string        // Observed / Likely / Possible / Unlikely
  resources?: number        // ground resources deployed
  aircraft?: number         // aircraft deployed
  reportedAt?: string       // ISO 8601 , when first reported
  link?: string
}

// ─── Infrastructure (Geoscience Australia) ────────────────────────────────

export interface Substation {
  id: string
  name: string
  coordinates: [number, number]  // [lng, lat]
  voltage?: string
  operator?: string
}

export interface TransmissionLine {
  id: string
  name?: string
  coordinates: [number, number][]  // [lng, lat] points along line
  voltage?: string
  operator?: string
}

// ─── Outages (SAPN feed) ──────────────────────────────────────────────────

export interface Outage {
  id: string
  status: string
  geometry: GeoJSON.Geometry
  affectedCustomers?: number
  estimatedRestoration?: string
}

// ─── Proximity (calculated client-side) ───────────────────────────────────

export interface ProximityAlert {
  incident: Incident
  substation: Substation
  distanceKm: number
}

// ─── Dashboard State ──────────────────────────────────────────────────────

export interface DashboardState {
  incidents: Incident[]
  substations: Substation[]
  transmissionLines: TransmissionLine[]
  outages: Outage[]
  proximityAlerts: ProximityAlert[]
  lastUpdated: Date | null
  isConnected: boolean
  error: string | null
}

// ─── KPI data (derived from state) ────────────────────────────────────────

export interface KPIData {
  activeIncidents: number
  fireDangerLevel: 'Catastrophic' | 'Extreme' | 'High' | 'Moderate' | 'None'
  assetsAtRisk: number
  nearestIncidentKm: number | null
  lastUpdated: Date | null
  isConnected: boolean
}

// ─── Dashboard Settings ──────────────────────────────────────────────────

export const ALL_INCIDENT_TYPES: IncidentType[] = [
  'Bushfire', 'Structure Fire', 'Storm', 'Flood',
  'Accident', 'Rescue', 'Medical', 'Alarm', 'Other',
]

export interface DashboardSettings {
  visibleTypes: Record<string, boolean>
  notifyWhenHidden: Record<string, boolean>
  customRadii: Record<string, number>
  showSubstations: boolean
  showTransmissionLines: boolean
  showSAPNLines: boolean
  showDistributionFeeders: boolean
  showLVNetwork: boolean
  showPoles: boolean
  showProximityRings: boolean
  showGenerationMix: boolean
}

// ─── Geoscience Australia REST response ───────────────────────────────────

export interface GAFeature {
  attributes: Record<string, unknown>
  geometry: {
    x?: number
    y?: number
    paths?: number[][][]
    rings?: number[][][]
  }
}

export interface GAQueryResponse {
  features: GAFeature[]
}
