# SAPN Outage Proxy — Implementation Pattern

## How It Works

Public utility outage maps load their pins/polygons from unauthenticated JSON endpoints behind a WAF that only checks `User-Agent` and `Referer`. Spoof those headers server-side and you get fully structured data with coordinates included — no API key, no scraping, no geocoding.

---

## Step 1 — Find the Endpoints

1. Open the SAPN outage map in Chrome: https://www.sapowernetworks.com.au/power-outages/current-outages/
2. DevTools → Network tab → filter **Fetch/XHR**
3. Reload the map
4. Look for JSON responses with words like `outages`, `incidents`, `events`, `getCurrent`, `getPlanned`
5. Copy the **request URL**, **User-Agent**, and **Referer** from the request headers
6. Inspect the response — look for `geometry`, `polygon`, `coordinates`, or `points` (array of `{lat,lng}`)

If you find that → you're done discovering.  
If the response is HTML → WAF blocked you, Referer is wrong.

**Note:** Owner has these URLs from a previous project. Once retrieved, hardcode them into the proxy route (server-side, never exposed to client).

---

## Step 2 — The Proxy Route

Next.js API route at `src/app/api/proxy/outages/route.ts` fetches server-side with spoofed headers:

```typescript
import { NextResponse } from 'next/server'

const CURRENT_URL = 'https://[sapn-domain]/path/GetCurrentOutages/'
const PLANNED_URL = 'https://[sapn-domain]/path/GetPlannedOutages/'

const SPOOF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
  'Accept': 'application/json, text/javascript, */*',
  'Referer': 'https://[sapn-domain]/path/OutageMap',  // ← Critical, WAF checks this
}
```

The client (`sapnOutage.ts`) calls `/api/proxy/outages` — our own server route — rather than SAPN directly. This keeps the spoof headers server-side and avoids CORS.

---

## Step 3 — Rendering

Convert each outage's coordinate array into a closed GeoJSON Polygon:
- First point must equal last point (closes the ring)
- GeoJSON expects `[lng, lat]` — most utility APIs return `{lat, lng}` — **swap them**

Render with Mapbox GL fill + stroke layers (see `DashboardMap.tsx` outage layers).

Poll proxy every **5 minutes** — outages change slowly.

---

## Gotchas

| Issue | Fix |
|-------|-----|
| Response is HTML not JSON | Referer header wrong or missing |
| Polygon doesn't render | First and last coord must be identical |
| Coords look wrong on map | GeoJSON = `[lng, lat]`, API likely = `{lat, lng}` — swap |
| Endpoint stops working | Re-run DevTools discovery — SAPN may have changed URL path |

---

## Files in This Project

| File | Role |
|------|------|
| `src/app/api/proxy/outages/route.ts` | Server-side proxy with spoofed headers |
| `src/lib/sapnOutage.ts` | Client that calls `/api/proxy/outages` (not SAPN directly) |
| `src/components/DashboardMap.tsx` | Renders outage GeoJSON as fill + stroke layers |
| `src/hooks/useOutages.ts` | Polls `/api/proxy/outages` every 5 minutes |

---

## Endpoint Discovery Status

- [ ] Current outages URL: *(owner to retrieve from previous project or DevTools)*
- [ ] Planned outages URL: *(owner to retrieve from previous project or DevTools)*
- [ ] Confirmed User-Agent value
- [ ] Confirmed Referer value
- [ ] Polygon coordinate field name in response: *(e.g. `points`, `coordinates`, `polygon`)*
