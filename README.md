# Emergency Infrastructure Dashboard

A real-time emergency operations dashboard for South Australian power infrastructure. Overlays live emergency incident data from [emergencyAPI.com](https://emergencyapi.com) onto SA Power Networks and ElectraNet infrastructure maps.

Built to demonstrate how Australian power utilities can integrate real-time emergency intelligence into their existing operational systems.

## What it does

- Live emergency incidents from 30+ Australian emergency feeds (CFS, MFS, SES, SAAS and more) via emergencyAPI.com
- 330 SA Power Networks zone substations with GIS-precise coordinates
- ElectraNet 132-275kV transmission network with animated current-flow visualisation
- SAPN 66kV sub-transmission feeders (164 lines)
- SAPN 11kV/19kV distribution network (87,000+ feeder segments)
- SAPN 433V/240V low-voltage network and pole locations
- Proximity detection: identifies when incidents are near power infrastructure
- Real-time SA generation mix from AEMO NEM data (Open Electricity API)
- Infrastructure warning system: timed alerts when emergencies threaten assets
- Configurable layer visibility, custom proximity radii, per-type notification controls

## Stack

- Next.js 15 (App Router)
- Mapbox GL JS
- Tailwind CSS
- TypeScript
- Deployed to Vercel

## Data sources

| Source | Data | Access |
|---|---|---|
| [emergencyAPI.com](https://emergencyapi.com) | Live emergency incidents across Australia | API key (free tier available) |
| [Geoscience Australia](https://services.ga.gov.au) | ElectraNet transmission infrastructure | Public REST MapServer |
| SA Power Networks DAPR | Zone substations, sub-transmission lines, distribution feeders | Public data via Rosetta Analytics |
| [BYDA](https://byda.maps.arcgis.com) | LV network, poles | Public ArcGIS Feature Service |
| [Open Electricity](https://openelectricity.org.au) | Real-time generation mix (AEMO NEM) | Public API |

## Setup

```bash
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Required environment variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_EMERGENCY_API_KEY` | emergencyAPI.com API key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL JS access token |

## Infrastructure data

GeoJSON files in `public/data/` are tracked with Git LFS. After cloning, run:

```bash
git lfs pull
```

To refresh the BYDA LV network and poles data:

```bash
node scripts/download-byda.mjs
```

## Licence

This project is a showcase for emergencyAPI.com. The infrastructure GeoJSON data is derived from publicly accessible Australian government and utility data sources.
