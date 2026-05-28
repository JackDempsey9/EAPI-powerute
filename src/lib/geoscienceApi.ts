import type { Substation, TransmissionLine, GAQueryResponse } from './types'

const BASE = 'https://services.ga.gov.au/gis/rest/services/National_Electricity_Infrastructure/MapServer'

/**
 * SAPN zone substation name lookup , derived from "2021-2022 Zone substation data 20221213 v1.0" CSVs.
 * Key: lowercase suburb name (stripped of voltage suffix).
 * Value: authoritative SAPN formatted name (e.g. "Burnside 66/11kV").
 * Used to enrich GA substation labels with official SAPN terminology.
 */
const SAPN_NAME_LOOKUP: Record<string, string> = {
  "aldgate": "Aldgate 33/11kV", "aldinga": "Aldinga 66/11kV", "allendale east": "Allendale East 33/11kV",
  "american river": "American River 33/11kV", "angaston": "Angaston 33/11kV", "angle vale": "Angle Vale 66/11kV",
  "ardrossan": "Ardrossan 33/11kV", "arno bay": "Arno Bay 33/11kV", "ascot park": "Ascot Park 66/11kV",
  "athol park": "Athol Park 66/11kV", "auburn": "Auburn 33/11kV", "balaklava": "Balaklava 33/7.6kV",
  "balhannah": "Balhannah 66/33kV", "beachport": "Beachport 33/11kV", "berri": "Berri 66/11kV",
  "birdwood": "Birdwood 33/11kV", "blackpool": "Blackpool 66/11kV", "blackwood": "Blackwood 66/11kV",
  "booleroo centre": "Booleroo Centre 33/11kV", "bordertown": "Bordertown 33/11kV", "burnside": "Burnside 66/11kV",
  "cadell": "Cadell 66/11kV", "campbelltown": "Campbelltown 66/11kV", "cape jervis": "Cape Jervis 33/11kV",
  "caralue": "Caralue 66/11kV", "cavan": "Cavan 66/11kV", "ceduna": "Ceduna 66/11kV",
  "cheltenham": "Cheltenham 66/11kV", "clare": "Clare 33/11kV", "clarence gardens": "Clarence Gardens 66/11kV",
  "clarendon": "Clarendon 66/11kV", "clearview": "Clearview 66/11kV", "cleve": "Cleve 66/11kV",
  "coffin bay": "Coffin Bay 33/11kV", "coromandel place": "Coromandel Place 66/11kV", "cowell": "Cowell 33/11kV",
  "croydon": "Croydon 66/11kV", "croydon park": "Croydon Park 66/11kV", "crystal brook": "Crystal Brook 33/11kV",
  "cudmore park": "Cudmore Park 66/11kV", "cummins": "Cummins 33/11kV", "darke peak": "Darke Peak 66/11kV",
  "direk": "Direk 66/11kV", "east terrace": "East Terrace 66/33kV", "edinburgh": "Edinburgh 66/11kV",
  "edithburgh": "Edithburgh 33/11kV", "elizabeth downs": "Elizabeth Downs 66/11kV",
  "elizabeth heights": "Elizabeth Heights 66/11kV", "elizabeth south": "Elizabeth South 66/11kV",
  "eudunda": "Eudunda 33/11kV", "evanston": "Evanston 66/11kV", "findon": "Findon 66/11kV",
  "flinders park": "Flinders Park 66/11kV", "forreston": "Forreston 33/11kV", "freeling": "Freeling 33/11kV",
  "fulham gardens": "Fulham Gardens 66/11kV", "glanville": "Glanville 66/11kV", "glencoe": "Glencoe 33/11kV",
  "glenelg north": "Glenelg North 66/11kV", "glossop": "Glossop 66/11kV", "golden grove": "Golden Grove 66/11kV",
  "goolwa": "Goolwa 66/11kV", "hackham": "Hackham 66/11kV", "hahndorf": "Hahndorf 66/11kV",
  "hamley bridge": "Hamley Bridge 33/11kV", "happy valley": "Happy Valley 66/11kV", "harrow": "Harrow 66/11kV",
  "hawker": "Hawker 33/11kV", "henley south": "Henley South 66/11kV", "hillcrest": "Hillcrest 66/11kV",
  "hindley street": "Hindley Street 66/33kV", "holden hill": "Holden Hill 66/11kV",
  "hope valley": "Hope Valley 66/11kV", "ingle farm": "Ingle Farm 66/11kV", "jamestown": "Jamestown 33/11kV",
  "kadina": "Kadina 33/11kV", "keith": "Keith 33/11kV", "kent town": "Kent Town 66/11kV",
  "kersbrook": "Kersbrook 33/11kV", "keswick": "Keswick 66/11kV", "kilburn": "Kilburn 66/11kV",
  "kilburn south": "Kilburn South 66/11kV", "kilkenny": "Kilkenny 66/11kV", "kingscote": "Kingscote 33/11kV",
  "kingswood": "Kingswood 66/11kV", "langhorne creek": "Langhorne Creek 66/11kV",
  "largs north": "Largs North 66/11kV", "lefevre": "LeFevre 66/11kV", "linden park": "Linden Park 66/11kV",
  "lobethal": "Lobethal 33/11kV", "lock": "Lock 66/11kV", "loveday": "Loveday 66/11kV",
  "lower mitcham": "Lower Mitcham 66/11kV", "loxton": "Loxton 66/11kV", "lyrup": "Lyrup 66/11kV",
  "maitland": "Maitland 33/11kV", "mallala": "Mallala 33/11kV", "meadows": "Meadows 66/11kV",
  "melrose": "Melrose 33/11kV", "meningie": "Meningie 33/11kV", "milang": "Milang 66/11kV",
  "millicent": "Millicent 33/11kV", "minlaton": "Minlaton 33/11kV", "morgan": "Morgan 66/11kV",
  "morphett vale east": "Morphett Vale East 66/11kV", "morphettville": "Morphettville 66/11kV",
  "mount barker": "Mount Barker 66/11kV", "mount gambier": "Mount Gambier 33/11kV",
  "mount gambier north": "Mount Gambier North 33/11kV", "mount gambier west": "Mount Gambier West 33/11kV",
  "mount pleasant": "Mount Pleasant 33/11kV", "murray bridge north": "Murray Bridge North 33/11kV",
  "murray bridge south": "Murray Bridge South 33/11kV", "mylor": "Mylor 33/11kV", "myponga": "Myponga 66/11kV",
  "nairne": "Nairne 33/11kV", "naracoorte": "Naracoorte 33/11kV", "naracoorte east": "Naracoorte East 33/11kV",
  "new osborne": "New Osborne 66/11kV", "new richmond": "New Richmond 66/11kV",
  "noarlunga centre": "Noarlunga Centre 66/11kV", "north adelaide": "North Adelaide 66/11kV",
  "north unley": "North Unley 66/11kV", "northfield": "Northfield 66/11kV", "norwood": "Norwood 66/11kV",
  "nuriootpa": "Nuriootpa 33/11kV", "oaklands": "Oaklands 66/11kV", "panorama": "Panorama 66/11kV",
  "parafield gardens": "Parafield Gardens 66/11kV", "paralowie": "Paralowie 66/11kV",
  "penfield": "Penfield 66/11kV", "penola": "Penola 33/11kV", "peterborough": "Peterborough 33/11kV",
  "plympton": "Plympton 66/11kV", "polda": "Polda 66/11kV", "port adelaide": "Port Adelaide 66/11kV",
  "port adelaide north": "Port Adelaide North 66/11kV", "port augusta": "Port Augusta 33/11kV",
  "port broughton": "Port Broughton 33/11kV", "port germein": "Port Germein 33/11kV",
  "port noarlunga": "Port Noarlunga 66/11kV", "port pirie south": "Port Pirie South 33/11kV",
  "port stanvac": "Port Stanvac 66/11kV", "portee": "Portee 66/11kV", "prospect": "Prospect 66/11kV",
  "pyap": "Pyap 66/11kV", "queenstown": "Queenstown 66/11kV", "quorn": "Quorn 33/11kV",
  "renmark": "Renmark 66/11kV", "riverton": "Riverton 33/11kV", "robertstown": "Robertstown 33/11kV",
  "salisbury": "Salisbury 66/11kV", "seacombe": "Seacombe 66/11kV", "seaford": "Seaford 66/11kV",
  "sheidow park": "Sheidow Park 66/11kV", "smithfield west": "Smithfield West 66/11kV",
  "stansbury": "Stansbury 33/11kV", "strathalbyn": "Strathalbyn 66/11kV", "streaky bay": "Streaky Bay 66/11kV",
  "swan reach": "Swan Reach 66/33kV", "tea tree gully": "Tea Tree Gully 66/11kV",
  "thebarton": "Thebarton 66/11kV", "tonsley park": "Tonsley Park 66/11kV", "tumby bay": "Tumby Bay 33/11kV",
  "two wells": "Two Wells 66/11kV", "victor harbor": "Victor Harbor 66/11kV", "virginia": "Virginia 66/11kV",
  "waikerie": "Waikerie 66/11kV", "wallaroo": "Wallaroo 33/11kV", "whitmore square": "Whitmore Square 66/11kV",
  "whyalla city": "Whyalla City 33/11kV", "whyalla north": "Whyalla North 33/11kV",
  "williamstown": "Williamstown 33/11kV", "willunga": "Willunga 66/33kV",
  "woodforde": "Woodforde 66/11kV", "woodside": "Woodside 33/11kV", "woodville": "Woodville 66/33kV",
  "woolpunda": "Woolpunda 66/11kV", "wudinna": "Wudinna 66/11kV", "yankalilla": "Yankalilla 66/33kV",
  "yorketown": "Yorketown 33/11kV",
}

/**
 * Attempt to enrich a GA substation name with the authoritative SAPN zone name.
 * Only matches on GA `name` , locality matching creates false positives because
 * 132kV/275kV ElectraNet transmission substations can share locality names with
 * SAPN zone substations (e.g. "Mount Barker South" 275kV vs "Mount Barker 66/11kV").
 */
function enrichSubstationName(gaName: string): string {
  const nameLower = gaName.trim().toLowerCase()
  return SAPN_NAME_LOOKUP[nameLower] ?? gaName
}

// SA bounding box: minX, minY, maxX, maxY (WGS84)
const SA_BBOX = '129,-38,141,-26'
// Layer 0 = substations (points) , mix of ElectraNet & SAPN zone substations
// Layer 2 = transmission lines (polylines) , ElectraNet's high-voltage network (132kV–275kV)
//   ElectraNet owns/operates the HV transmission grid that feeds into SAPN zone substations,
//   which then distribute to customers at lower voltages.

const COMMON_PARAMS = new URLSearchParams({
  geometry: SA_BBOX,
  geometryType: 'esriGeometryEnvelope',
  spatialRel: 'esriSpatialRelIntersects',
  outFields: '*',
  outSR: '4326',
  resultRecordCount: '2000',
  f: 'json',
})

// Transmission lines only: filter to 66 kV and above (ElectraNet HV network).
// The SA dataset contains 2 × 33 kV lines that are sub-transmission/distribution
// and don't belong on a HV infrastructure map.
const TRANSMISSION_PARAMS = new URLSearchParams(COMMON_PARAMS)
TRANSMISSION_PARAMS.set('where', 'capacitykv >= 66')

export async function fetchSubstations(): Promise<Substation[]> {
  const url = `${BASE}/0/query?${COMMON_PARAMS}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Geoscience Australia substations error: ${res.status}`)
  const data: GAQueryResponse = await res.json()

  return data.features
    .filter((f) => f.geometry?.x !== undefined && f.geometry?.y !== undefined)
    .map((f, i) => {
      const gaName = String(
        f.attributes?.name ??
        f.attributes?.NAME ??
        f.attributes?.SUBST_NAME ??
        f.attributes?.LABEL ??
        'Unnamed Substation'
      )
      return {
        id: String(f.attributes?.objectid ?? f.attributes?.OBJECTID ?? f.attributes?.FID ?? i),
        name: enrichSubstationName(gaName),
        coordinates: [f.geometry.x!, f.geometry.y!] as [number, number],
        voltage: f.attributes?.voltagekv ? String(f.attributes.voltagekv) : undefined,
        operator: f.attributes?.OPERATOR ? String(f.attributes.OPERATOR) : undefined,
      }
    })
}

export async function fetchTransmissionLines(): Promise<TransmissionLine[]> {
  const url = `${BASE}/2/query?${TRANSMISSION_PARAMS}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Geoscience Australia lines error: ${res.status}`)
  const data: GAQueryResponse = await res.json()

  return data.features
    .filter((f) => f.geometry?.paths && f.geometry.paths.length > 0)
    .map((f, i) => ({
      id: String(f.attributes?.objectid ?? f.attributes?.OBJECTID ?? f.attributes?.FID ?? i),
      name: f.attributes?.name ? String(f.attributes.name) : undefined,
      coordinates: f.geometry.paths![0].map(([x, y]) => [x, y] as [number, number]),
      voltage: f.attributes?.capacitykv ? `${f.attributes.capacitykv}kV` : undefined,
      operator: 'ElectraNet',
    }))
}
