/**
 * SAPN local GeoJSON data loader.
 *
 * Data source: SA Power Networks DAPR portal (dapr.sapowernetworks.com.au),
 * served via Rosetta Analytics CDN, decrypted and stored in /public/data/.
 *
 * Files:
 *   sapn-zone-substations.geojson  , 330 SAPN zone substations with GIS coords
 *   sapn-66kv-lines.geojson        , 164 SAPN 66kV sub-transmission feeders
 *   sapn-tcp-substations.geojson   , 50 ElectraNet Transmission Connection Points
 */

import type { Substation, TransmissionLine } from './types'

interface SAPNSubstationProps {
  id: string
  name: string
  rawName: string
  ssdId: string
  assetType: string
}

interface SAPNLineProps {
  FEEDER1_ID: string
  Name: string
  Operating_: string
  SSD_ID: string
  Substation: string
}

/** Load SAPN zone substations from the local public/data GeoJSON file. */
export async function fetchSAPNSubstations(): Promise<Substation[]> {
  const res = await fetch('/data/sapn-zone-substations.geojson')
  if (!res.ok) throw new Error(`Failed to load SAPN substations: ${res.status}`)

  const data = await res.json() as GeoJSON.FeatureCollection<GeoJSON.Point, SAPNSubstationProps>

  return data.features
    .filter((f) => f.geometry?.coordinates?.length >= 2)
    .map((f) => ({
      id: f.properties.ssdId || f.properties.id,
      name: f.properties.name,
      coordinates: [f.geometry.coordinates[0], f.geometry.coordinates[1]] as [number, number],
      voltage: extractVoltage(f.properties.name),
      operator: 'SA Power Networks',
    }))
}

/** Load SAPN 66kV sub-transmission lines from local GeoJSON. */
export async function fetchSAPNSubTransmissionLines(): Promise<TransmissionLine[]> {
  const res = await fetch('/data/sapn-66kv-lines.geojson')
  if (!res.ok) throw new Error(`Failed to load SAPN 66kV lines: ${res.status}`)

  const data = await res.json() as GeoJSON.FeatureCollection<GeoJSON.MultiLineString, SAPNLineProps>

  return data.features
    .filter((f) => f.geometry?.coordinates?.length > 0)
    .flatMap((f) =>
      f.geometry.coordinates.map((lineCoords, i) => ({
        id: `${f.properties.FEEDER1_ID}-${i}`,
        name: f.properties.Name || undefined,
        coordinates: lineCoords.map(([x, y]) => [x, y] as [number, number]),
        voltage: f.properties.Operating_,
        operator: 'SA Power Networks',
      }))
    )
}

/** Load SAPN 11kV + 19kV distribution feeders (every street in SA). */
export async function fetchSAPNDistributionFeeders(): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch('/data/sapn-distribution-feeders.geojson')
  if (!res.ok) throw new Error(`Failed to load SAPN distribution feeders: ${res.status}`)
  return res.json()
}

/** Load SAPN LV network (433V/240V) from local GeoJSON. */
export async function fetchSAPNLVNetwork(): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch('/data/sapn-lv-network.geojson')
  if (!res.ok) throw new Error(`Failed to load SAPN LV network: ${res.status}`)
  return res.json()
}

/** Load SAPN poles from local GeoJSON. */
export async function fetchSAPNPoles(): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch('/data/sapn-poles.geojson')
  if (!res.ok) throw new Error(`Failed to load SAPN poles: ${res.status}`)
  return res.json()
}

/** Load SAPN depot locations from local GeoJSON. */
export async function fetchSAPNDepots(): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch('/data/sapn-depots.geojson')
  if (!res.ok) throw new Error(`Failed to load SAPN depots: ${res.status}`)
  return res.json()
}

/** Parse voltage kV from a SAPN name like "Burnside 66/11kV" → "66" */
function extractVoltage(name: string): string | undefined {
  const m = name.match(/(\d+)\/?\d*kV/)
  return m ? `${m[1]}kV` : undefined
}
