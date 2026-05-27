// ─── Emergency Incidents (emergencyAPI.com) ────────────────────────────────

export type IncidentType =
  | 'Bushfire'
  | 'Storm'
  | 'Flood'
  | 'Accident'
  | 'Rescue'
  | 'Other'

export type IncidentStatus =
  | 'Emergency Warning'
  | 'Watch and Act'
  | 'Advice'
  | 'Information'
  | 'Not Applicable'

export interface Incident {
  id: string
  type: IncidentType
  status: IncidentStatus
  title: string
  location: string
  state: string
  source: string        // CFS, SES, MFS, etc.
  updatedAt: string     // ISO 8601
  coordinates: [number, number]  // [lng, lat]
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
