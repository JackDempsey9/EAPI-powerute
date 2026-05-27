# CLAUDE.md — Project Context for Claude Code

## What We're Building

A live web dashboard showcasing [emergencyAPI.com](https://emergencyapi.com) as supplementary real-time emergency data for Australian power utilities. This is a YouTube showcase — screen-recorded to demonstrate how utilities can integrate the emergencyAPI.com API into their existing platforms.

**The core message:** "Your outage system tells you what's already broken. emergencyAPI.com tells you what's about to break."

## Key Decisions Already Made

- **Layout:** War Room — KPI strip across the top, large map (~75% width), live incident feed on the right
- **Map:** Mapbox GL JS, dark ops theme, centred on South Australia, 3D substation icons
- **Data:** Live polling (not static/mock) — real data makes the showcase credible
- **Geography:** SA-focused (richest data, owner is ex-SAPN), but Australia-wide capable
- **Purpose:** Screen-recorded YouTube video. Not a production SaaS. Needs to look stunning.

## Data Sources

1. **emergencyAPI.com** — live incidents, poll every 30s, GeoJSON, free 500 req/day
   - Endpoint: `https://emergencyapi.com/api/v1/incidents`
   - SA feeds: CFS, SES, MFS, CFS-PAGER, SES-PAGER, BOMBER-PAGER
   - API key in env: `NEXT_PUBLIC_EMERGENCY_API_KEY`

2. **Geoscience Australia** — real SA substation locations + transmission lines
   - REST MapServer: `https://services.ga.gov.au/gis/rest/services/National_Electricity_Infrastructure/MapServer`
   - No API key required, free public service
   - Filter by SA bounding box

3. **SAPN Outage Feed** — proxied server-side via `/api/proxy/outages`
   - Pattern: spoof `User-Agent` + `Referer` headers to bypass the public outage map WAF
   - Proxy route: `src/app/api/proxy/outages/route.ts`
   - Client calls `/api/proxy/outages` (our own route), not SAPN directly
   - Endpoint URLs hardcoded in the proxy (server-side, never exposed to browser)
   - See `docs/SAPN-OUTAGE-PROXY.md` for the full pattern
   - No API key or env var required — public data, WAF bypass only

4. **Mapbox** — map tiles and rendering
   - API key in env: `NEXT_PUBLIC_MAPBOX_TOKEN`

## Tech Stack

```
Next.js 15 (App Router)
Mapbox GL JS
Tailwind CSS
TypeScript
Deployed to Vercel
```

## Project Structure (planned)

```
src/
  app/
    page.tsx              # Main dashboard page
    layout.tsx            # Root layout
  components/
    dashboard/
      KPIStrip.tsx        # Top metrics bar
      IncidentFeed.tsx    # Right panel live feed
      IncidentCard.tsx    # Individual incident item
    map/
      DashboardMap.tsx    # Main Mapbox map wrapper
      SubstationLayer.tsx # 3D substation icons
      IncidentLayer.tsx   # Emergency incident markers
      ProximityLayer.tsx  # Proximity rings around incidents
      OutageLayer.tsx     # SAPN outage zones
    ui/
      Badge.tsx
      StatusDot.tsx
  lib/
    emergencyApi.ts       # emergencyAPI.com client
    geoscienceApi.ts      # Geoscience Australia client
    sapnOutage.ts         # SAPN outage feed client
    proximity.ts          # Distance/proximity calculations
    types.ts              # Shared TypeScript types
  hooks/
    useEmergencyFeed.ts   # Live polling hook
    useSubstations.ts     # Substation data hook
    useOutages.ts         # SAPN outage hook
```

## Commands

```bash
npm run dev       # Local development
npm run build     # Production build
npm run lint      # ESLint
```

## Important Context

- Owner is an ex-SA Power Networks employee with current SAPN contacts
- The dashboard is NOT branded as SAPN — it's a generic "power utility" context
- emergencyAPI.com is the product being showcased — it should be prominently credited
- "Powered by emergencyAPI.com" badge on the map
- The Geoscience Australia data gives us REAL substation locations — no need to simulate
- Keep the UI dark, professional, ops-centre feeling
- Every data point on screen should be real and verifiable

## Do Not

- Add user authentication
- Add a database
- Build admin panels or settings pages
- Over-engineer — this is a showcase, not a production platform
- Use SA Power Networks branding or name anywhere in the UI
