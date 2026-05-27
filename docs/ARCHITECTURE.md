# Architecture

## Overview

Single-page Next.js web application. No backend, no database, no authentication. The app runs entirely in the browser and fetches data directly from public APIs. Designed to be screen-recorded for a YouTube showcase video.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | Industry standard, Vercel-native, fast |
| Map | Mapbox GL JS | Best-in-class dark theme maps, 3D support, GeoJSON native |
| Styling | Tailwind CSS | Rapid dark UI development |
| Language | TypeScript | Type safety for API responses and data models |
| Deployment | Vercel | Zero-config, free tier, live URL for sharing |

## Application Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Single dashboard page
│   └── globals.css             # Global styles, Tailwind base
│
├── components/
│   ├── dashboard/
│   │   ├── KPIStrip.tsx        # Top metrics bar (5 KPI tiles)
│   │   ├── IncidentFeed.tsx    # Right panel — live incident list
│   │   └── IncidentCard.tsx    # Individual incident card component
│   │
│   ├── map/
│   │   ├── DashboardMap.tsx    # Mapbox GL wrapper, layer orchestration
│   │   ├── SubstationLayer.tsx # Real substations from Geoscience Australia
│   │   ├── TransmissionLayer.tsx # Transmission lines from Geoscience Australia
│   │   ├── IncidentLayer.tsx   # emergencyAPI.com incident markers
│   │   ├── ProximityLayer.tsx  # Proximity rings around incidents near assets
│   │   └── OutageLayer.tsx     # SAPN outage zones
│   │
│   └── ui/
│       ├── Badge.tsx           # Severity/type badges
│       ├── StatusDot.tsx       # Live/connecting/error status indicator
│       └── PoweredBy.tsx       # "Powered by emergencyAPI.com" attribution
│
├── lib/
│   ├── emergencyApi.ts         # emergencyAPI.com fetch + parsing
│   ├── geoscienceApi.ts        # Geoscience Australia MapServer client
│   ├── sapnOutage.ts           # SAPN outage feed client
│   ├── proximity.ts            # Haversine distance calculations
│   └── types.ts                # Shared TypeScript interfaces
│
└── hooks/
    ├── useEmergencyFeed.ts     # Polls emergencyAPI.com every 30s
    ├── useSubstations.ts       # Fetches + caches GA substation data
    └── useOutages.ts           # Polls SAPN outage feed
```

## Data Flow

```
emergencyAPI.com ──────────────────────────────────┐
  (poll every 30s, GeoJSON)                         │
                                                    ▼
Geoscience Australia ──────────────────────→  proximity.ts
  (fetch once on load, cache)                  (calculates
  substations + transmission lines             incident ↔ asset
                                               distances)
SAPN Outage Feed ──────────────────────────────────┐
  (poll every 60s)                                  │
                                                    ▼
                                             Dashboard State
                                                    │
                    ┌───────────────────────────────┤
                    │                               │
                    ▼                               ▼
              DashboardMap                    KPIStrip + IncidentFeed
              (Mapbox GL)                     (React components)
```

## Key Architectural Decisions

### Client-side only (no API routes)
All data fetching happens in the browser. emergencyAPI.com and Geoscience Australia are CORS-friendly public APIs. SAPN outage feed may need a Next.js API route as a proxy if it doesn't allow cross-origin requests — we'll add `/api/outages` if needed.

### Polling vs WebSocket
emergencyAPI.com doesn't offer WebSocket/SSE. We poll:
- Emergency incidents: every 30 seconds
- SAPN outages: every 60 seconds
- Geoscience Australia substations: once on load, cached (static data)

### Proximity calculation
Client-side Haversine formula. For each incident, calculate distance to every substation. Flag substations within configurable radius (default: 5km for bushfire, 10km for storm). This runs in the browser — the dataset is small enough (~200 SA substations) that this is fast.

### Map layers order (Mapbox GL)
1. Base map (Mapbox dark style)
2. Transmission lines (bottom — subtle)
3. Outage zones (semi-transparent fill)
4. Proximity rings (dashed circles around incidents)
5. Substation icons / 3D models
6. Incident markers (top — most prominent)

## Environment Variables

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=        # Mapbox GL JS public token
NEXT_PUBLIC_EMERGENCY_API_KEY=   # emergencyAPI.com API key
SAPN_OUTAGE_FEED_URL=            # SAPN outage feed URL (owner to provide)
```

See `docs/SECRETS.md` for where to obtain each key.

## Deployment

Deployed to Vercel via CLI or GitHub integration. The app is static-capable but uses client-side fetching, so it deploys as a standard Next.js app. No server-side data fetching required.

```bash
vercel deploy
```

## Performance Considerations

- Geoscience Australia substation data is fetched once and stored in React state (not re-fetched)
- emergencyAPI.com responses are small GeoJSON (typically < 50KB for SA)
- Mapbox GL handles all rendering on the GPU — smooth even with many markers
- No heavy dependencies beyond Mapbox GL itself
