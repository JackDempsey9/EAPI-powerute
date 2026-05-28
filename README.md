# Emergency Infrastructure Dashboard

Real-time emergency operations dashboard for South Australian power infrastructure. Overlays live emergency incident data from [emergencyAPI.com](https://emergencyapi.com) onto SA Power Networks and ElectraNet infrastructure maps. SCADA-style interface designed for operational use.

## What it does

- Live emergency incidents from 30+ Australian emergency feeds via emergencyAPI.com
- 10 incident types: Bushfire, Structure Fire, Storm, Flood, Accident, Rescue, Medical, Alarm, Tree Down, Other
- 330 SA Power Networks zone substations with GIS-precise coordinates
- 50 ElectraNet Transmission Connection Points
- ElectraNet 132-275kV transmission network
- SAPN 66kV sub-transmission feeders (164 lines)
- SAPN 11kV/19kV distribution network (87,000+ feeder segments)
- SAPN 433V/240V low-voltage network and pole locations (partial dataset)
- 31 SAPN crew depot locations across SA
- Live SAPN outage data (current + planned, 300+ zones with affected customer counts)
- Feeder impact detection: identifies which specific feeder is at risk when an incident is within 50m
- Real-time SA generation mix from AEMO NEM data (Open Electricity API)
- Infrastructure warning system with timed auto-dismiss alerts
- Settings panel: layer toggles, custom proximity radii, per-type notification controls

## Stack

- Next.js 15 (App Router)
- Mapbox GL JS
- Tailwind CSS
- TypeScript
- IBM Plex Sans + JetBrains Mono

## Data sources

| Source | Data | Access |
|---|---|---|
| [emergencyAPI.com](https://emergencyapi.com) | Live emergency incidents across Australia | API key (free tier available) |
| [Geoscience Australia](https://services.ga.gov.au) | ElectraNet transmission infrastructure | Public REST MapServer |
| SA Power Networks DAPR | Zone substations, TCP substations, sub-transmission, distribution feeders | Public data via Rosetta Analytics |
| [BYDA](https://byda.maps.arcgis.com) | LV network, poles | Public ArcGIS Feature Service |
| [Open Electricity](https://openelectricity.org.au) | Real-time generation mix (AEMO NEM) | Public API |
| SA Power Networks outage feed | Current and planned outages with polygon geometry | Server-side proxy |

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

GeoJSON files in `public/data/` are tracked with Git LFS. After cloning:

```bash
git lfs pull
```

To download additional BYDA LV network and poles data:

```bash
node scripts/download-byda.mjs
```

## Licence

Open source. Infrastructure GeoJSON data is derived from publicly accessible Australian government and utility data sources.
