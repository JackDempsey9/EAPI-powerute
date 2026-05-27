# Data Sources

All data displayed in the dashboard is real, live, publicly available Australian data.

---

## 1. emergencyAPI.com — Live Emergency Incidents

**The star of the showcase.** Real-time emergency incident data aggregated from all Australian state emergency services.

### Endpoint
```
GET https://emergencyapi.com/api/v1/incidents
```

### Authentication
API key passed as a header or query parameter. See docs/SECRETS.md for the key.

### Response Format
GeoJSON FeatureCollection — each feature is one incident:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "category": "Bushfire",
        "status": "Emergency Warning",
        "source": "CFS",
        "state": "SA",
        "title": "Bushfire - McLaren Vale",
        "updated": "2026-05-27T10:30:00Z",
        "link": "https://..."
      },
      "geometry": {
        "type": "Point",
        "coordinates": [138.71, -35.09]
      }
    }
  ]
}
```

### SA-Specific Feeds
emergencyAPI.com aggregates these SA agency feeds:
- **CFS** — Country Fire Service (bushfire)
- **CFS-PAGER** — CFS pager alerts
- **SES** — State Emergency Service (storm, flood)
- **SES-PAGER** — SES pager alerts
- **MFS** — Metropolitan Fire Service (urban incidents)
- **BOMBER-PAGER** — Aerial firefighting alerts

### Rate Limits
- **Free tier:** 500 requests/day
- At 1 request per 30 seconds: ~2,880 requests/day needed for continuous polling
- **Recommendation:** Poll every 60–120 seconds for production. During the showcase recording, 30s is fine.
- Paid tiers available for higher volume

### Polling Interval
`useEmergencyFeed.ts` polls every **30 seconds** during recording session.

### Filtering for SA
Filter client-side by `properties.state === "SA"` OR use query parameters if the API supports state filtering (check docs at emergencyapi.com/docs).

---

## 2. Geoscience Australia — Substations & Transmission Lines

**Real SA electricity infrastructure.** National dataset from Geoscience Australia, freely queryable via REST MapServer.

### Base URL
```
https://services.ga.gov.au/gis/rest/services/National_Electricity_Infrastructure/MapServer
```

### Substation Endpoint
```
GET https://services.ga.gov.au/gis/rest/services/National_Electricity_Infrastructure/MapServer/0/query
```

Query parameters for SA substations:
```
where=STATE='SA'
outFields=*
outSR=4326
f=geojson
```

Full URL example:
```
https://services.ga.gov.au/gis/rest/services/National_Electricity_Infrastructure/MapServer/0/query?where=STATE%3D%27SA%27&outFields=*&outSR=4326&f=geojson
```

### Transmission Lines Endpoint
```
GET https://services.ga.gov.au/gis/rest/services/National_Electricity_Infrastructure/MapServer/2/query
```

Same query parameters, filter by SA bounding box:
```
geometry=-140,-38,-129,-26
geometryType=esriGeometryEnvelope
spatialRel=esriSpatialRelIntersects
outSR=4326
f=geojson
```

### Layer IDs
| Layer ID | Contents |
|----------|----------|
| 0 | Transmission Substations |
| 1 | Major Power Stations |
| 2 | Electricity Transmission Lines |

### Authentication
None required. Free public government data service.

### Caching Strategy
Fetch once on app load. Data doesn't change frequently. Cache in React state for the session lifetime. No need to re-poll.

### Expected Response
GeoJSON FeatureCollection with Point features for substations, LineString features for transmission lines. Properties include substation name, voltage, operator, coordinates.

---

## 3. SAPN Outage Feed

**Current power outages across South Australia.** Feed URL to be provided by project owner (retrieved from previous project).

### Status
⚠️ URL not yet confirmed — owner to provide.

### Expected Format
Likely GeoJSON or JSON with outage zone polygons/points. Will need to parse and display as semi-transparent affected zones on the map.

### Environment Variable
```
SAPN_OUTAGE_FEED_URL=<url-to-be-provided>
```

### Polling Interval
Every **60 seconds** — outages don't change as rapidly as emergency incidents.

### Fallback
If the SAPN feed is unavailable or returns errors, the dashboard degrades gracefully — outage layer is hidden, other data layers continue to display normally. A subtle "Outage data unavailable" indicator replaces the outage layer.

---

## 4. Mapbox — Map Tiles & Rendering

### Map Style
`mapbox://styles/mapbox/dark-v11` — dark base map, ideal for ops dashboards.

### Initial View
```javascript
center: [138.6, -34.9]  // Adelaide, SA
zoom: 6                  // Shows most of SA
```

### SA Bounding Box
```
SW: [129.0, -38.0]
NE: [141.0, -26.0]
```

### Authentication
Public token — safe to expose in client-side code (restricted to your domain in Mapbox dashboard).

### Environment Variable
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

---

## Data Credibility Notes

Every data point on screen is real and verifiable:
- emergencyAPI.com incidents can be cross-referenced with CFS/SES/MFS websites
- Geoscience Australia substations are the official national infrastructure dataset
- SAPN outage data comes from SAPN's own systems
- Mapbox provides satellite/topographic base context

This is important for the showcase — it's not simulated data, it's the actual current state of SA emergency and infrastructure information.
