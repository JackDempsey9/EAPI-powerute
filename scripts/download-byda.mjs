#!/usr/bin/env node

/**
 * Downloads SA Power Networks LV distribution lines and poles from BYDA ArcGIS.
 * Paginates through the full dataset and saves as compact local GeoJSON.
 *
 * Usage: node scripts/download-byda.mjs
 */

import { writeFileSync } from 'fs'

const BYDA_BASE = 'https://services-ap1.arcgis.com/ug6sGLFkytbXYo4f/arcgis/rest/services'
const PAGE_SIZE = 2000
const THROTTLE_MS = 1200

async function downloadLayer(name, url, outFields, transformFeat) {
  console.log(`\n=== Downloading ${name} ===`)

  const countUrl = `${url}?where=OWNER%3D'SA+Power'&returnCountOnly=true&f=json`
  const countRes = await fetch(countUrl)
  const countData = await countRes.json()
  const total = countData.count
  console.log(`Total features: ${total.toLocaleString()}`)

  const allFeatures = []
  let offset = 0
  let page = 0

  while (offset < total) {
    const queryUrl = `${url}?where=OWNER%3D'SA+Power'&outFields=${outFields}&outSR=4326&resultRecordCount=${PAGE_SIZE}&resultOffset=${offset}&f=geojson`

    const res = await fetch(queryUrl)
    if (!res.ok) {
      console.error(`  Page ${page}: HTTP ${res.status}, retrying in 5s...`)
      await sleep(5000)
      continue
    }

    const data = await res.json()
    const feats = data.features ?? []

    if (feats.length === 0) break

    for (const f of feats) {
      allFeatures.push(transformFeat(f))
    }

    offset += feats.length
    page++
    const pct = Math.min(100, (offset / total * 100)).toFixed(1)
    process.stdout.write(`\r  ${offset.toLocaleString()} / ${total.toLocaleString()} (${pct}%)`)

    await sleep(THROTTLE_MS)
  }

  console.log(`\n  Downloaded ${allFeatures.length.toLocaleString()} features`)
  return { type: 'FeatureCollection', features: allFeatures }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('BYDA SA Power Networks data downloader')
  console.log('This will take approximately 20-30 minutes due to API rate limits.')

  // LV Lines (433V/240V)
  const lvData = await downloadLayer(
    'LV Network (433V/240V)',
    `${BYDA_BASE}/LUAL_Network_LV_Public/FeatureServer/0/query`,
    'OPERATING_VOLTAGE,ASSET_TYPE',
    (f) => {
      const coords = f.geometry.coordinates.map(c =>
        Array.isArray(c[0])
          ? c.map(([lng, lat]) => [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5])
          : [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5]
      )
      return {
        type: 'Feature',
        properties: { v: (f.properties.OPERATING_VOLTAGE ?? '433V').slice(0, 3), t: f.properties.ASSET_TYPE ?? 'OH' },
        geometry: { type: f.geometry.type, coordinates: coords },
      }
    }
  )

  const lvPath = 'public/data/sapn-lv-network.geojson'
  writeFileSync(lvPath, JSON.stringify(lvData, null, 0))
  console.log(`  Saved to ${lvPath} (${(JSON.stringify(lvData).length / 1024 / 1024).toFixed(1)} MB)`)

  // Poles
  const polesData = await downloadLayer(
    'Poles',
    `${BYDA_BASE}/LUAL_Poles_Public/FeatureServer/0/query`,
    'ASSET_TYPE',
    (f) => {
      const [lng, lat] = f.geometry.coordinates
      return {
        type: 'Feature',
        properties: { t: f.properties.ASSET_TYPE ?? '' },
        geometry: { type: 'Point', coordinates: [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5] },
      }
    }
  )

  const polesPath = 'public/data/sapn-poles.geojson'
  writeFileSync(polesPath, JSON.stringify(polesData, null, 0))
  console.log(`  Saved to ${polesPath} (${(JSON.stringify(polesData).length / 1024 / 1024).toFixed(1)} MB)`)

  console.log('\nDone. Update sapnData.ts to load from local files instead of BYDA API.')
}

main().catch(console.error)
