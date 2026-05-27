import type { Substation, TransmissionLine, GAQueryResponse } from './types'

const BASE = 'https://services.ga.gov.au/gis/rest/services/National_Electricity_Infrastructure/MapServer'

// SA bounding box: minX, minY, maxX, maxY (WGS84)
const SA_BBOX = '129,-38,141,-26'

const COMMON_PARAMS = new URLSearchParams({
  geometry: SA_BBOX,
  geometryType: 'esriGeometryEnvelope',
  spatialRel: 'esriSpatialRelIntersects',
  outFields: '*',
  outSR: '4326',
  resultRecordCount: '2000',
  f: 'json',
})

export async function fetchSubstations(): Promise<Substation[]> {
  const url = `${BASE}/0/query?${COMMON_PARAMS}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Geoscience Australia substations error: ${res.status}`)
  const data: GAQueryResponse = await res.json()

  return data.features
    .filter((f) => f.geometry?.x !== undefined && f.geometry?.y !== undefined)
    .map((f, i) => ({
      id: String(f.attributes?.OBJECTID ?? f.attributes?.FID ?? i),
      name: String(
        f.attributes?.NAME ??
        f.attributes?.SUBST_NAME ??
        f.attributes?.LABEL ??
        'Unnamed Substation'
      ),
      coordinates: [f.geometry.x!, f.geometry.y!] as [number, number],
      voltage: f.attributes?.VOLTAGE ? String(f.attributes.VOLTAGE) : undefined,
      operator: f.attributes?.OPERATOR ? String(f.attributes.OPERATOR) : undefined,
    }))
}

export async function fetchTransmissionLines(): Promise<TransmissionLine[]> {
  const url = `${BASE}/2/query?${COMMON_PARAMS}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Geoscience Australia lines error: ${res.status}`)
  const data: GAQueryResponse = await res.json()

  return data.features
    .filter((f) => f.geometry?.paths && f.geometry.paths.length > 0)
    .map((f, i) => ({
      id: String(f.attributes?.OBJECTID ?? f.attributes?.FID ?? i),
      coordinates: f.geometry.paths![0].map(([x, y]) => [x, y] as [number, number]),
      voltage: f.attributes?.VOLTAGE ? String(f.attributes.VOLTAGE) : undefined,
      operator: f.attributes?.OPERATOR ? String(f.attributes.OPERATOR) : undefined,
    }))
}
