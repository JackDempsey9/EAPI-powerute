# Showcase Plan

## What This Demonstrates

This dashboard showcases emergencyAPI.com as a supplementary data layer for Australian power utilities. The message:

> "Your platform already handles outages. emergencyAPI.com adds the layer that warns you before they happen."

Three data sources combine to tell this story:
1. **Geoscience Australia** — your existing infrastructure (substations, transmission lines)
2. **SAPN outage feed** — what's already broken (reactive)
3. **emergencyAPI.com** — what's approaching (pre-warning)

## Key Features to Demonstrate on Video

### 1. The Infrastructure Reveal
Open the app full screen. Real SA substations appear as 3D icons across the state — Adelaide metro, Hills, Barossa, Eyre Peninsula, South East. Transmission lines between them. This establishes: this is real SA infrastructure data.

### 2. The KPI Strip
Scroll attention to the top bar. Five live metrics update in real time:
- Active incidents count
- Fire danger level (EXTREME if it's fire season — best recording time is Oct-Mar)
- Number of assets at risk
- Nearest incident distance
- Last data refresh timestamp

### 3. The Incident Feed
Right panel showing live incidents sorted by proximity to infrastructure. Each card shows distance to nearest substation — this is the emergencyAPI.com value prop visualised.

### 4. The Wow Moment — Click an Incident
Click a bushfire near the Adelaide Hills. The map flies to it. A proximity ring shows the 5km alert radius. The nearest substations light up red. The detail panel shows:
- Incident type, severity (Emergency Warning / Watch & Act)
- Source agency (CFS)
- Distance: "2.1km from Meadows Zone Substation"
- The raw data fields from emergencyAPI.com

### 5. The SAPN Outage Comparison
Toggle the outage layer on. Show existing outage zones. Contrast: "This is what your outage system already knows. These are areas already without power." Toggle it off. The emergencyAPI.com incidents remain — some are near substations that haven't yet had outages. "This is what emergencyAPI.com tells you — *before* the outage."

### 6. Zoom Out to Australia
Zoom the map out to show all of Australia. Incidents appear across NSW, VIC, QLD, WA. "One API key. The same feed. Every state. For any utility in the country."

## Best Time to Record

For maximum visual impact:
- **October – March (SA fire season):** Best for CFS bushfire incidents
- **Windy days / Storm warnings:** SES incidents increase
- **After major weather events:** Rich incident data across multiple types

Check the CFS and SES websites before recording to see what's active.

## Recording Setup

- Browser: Chrome, fullscreen (F11), 1920×1080 or 4K
- Screen recorder: OBS Studio (free) or QuickTime (Mac)
- Dashboard: Zoomed in to SA at zoom level 7-8 for the main showcase
- Suggested duration: 2–4 minutes (YouTube sweet spot for technical demos)

## Suggested Video Description

```
See how emergencyAPI.com provides real-time Australian emergency incident data — 
bushfires, storms, floods, and accidents — as a supplementary layer for power 
utility operations platforms.

This dashboard demonstrates live data from emergencyAPI.com overlaid on South 
Australian electricity infrastructure (substations and transmission lines from 
Geoscience Australia), showing proximity alerts when incidents occur near assets.

→ emergencyAPI.com: https://emergencyapi.com
→ Free tier: 500 requests/day, no credit card required
→ Covers all 8 Australian states and territories
→ GeoJSON format — plug straight into your existing GIS platform

Built with Next.js, Mapbox GL JS. Source: [GitHub link]
```

## Suggested YouTube Tags

```
emergencyAPI, emergency API Australia, Australian emergency data, bushfire API, 
power utility emergency management, electricity infrastructure monitoring, 
real-time emergency alerts Australia, CFS data feed, SES data API, 
bushfire monitoring dashboard, utility GIS dashboard, 
infrastructure risk management Australia, South Australia emergency data,
power network emergency management, pre-warning system utilities
```

## After the Video

- Pin the live dashboard URL in the video description
- Share with SAPN contacts directly ("made this to show how emergencyAPI.com could work for utilities like yours")
- Post on LinkedIn with emergencyAPI.com tagged
- Submit to emergencyAPI.com — they may want to feature it as a showcase
