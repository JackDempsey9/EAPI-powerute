# Design Specification

## Layout — War Room

The dashboard uses a "War Room" layout: a permanent KPI strip across the top, large interactive map taking ~75% of the remaining space, and a live incident feed panel on the right.

```
┌────────────────────────────────────────────────────────────┐
│  [INCIDENTS: 3]  [FIRE DANGER: EXTREME]  [AT RISK: 12]     │  ← KPI Strip
│  [CREWS: 4/18]   [LAST UPDATE: 14s ago]                    │    (fixed height ~80px)
├──────────────────────────────────────┬─────────────────────┤
│                                      │  LIVE INCIDENTS      │
│                                      │ ┌──────────────────┐ │
│                                      │ │ 🔴 BUSHFIRE       │ │
│           MAP                        │ │ McLaren Vale     │ │
│     (Mapbox GL JS)                   │ │ 2.1km from sub   │ │
│                                      │ └──────────────────┘ │
│  • Real SA substations (3D icons)    │ ┌──────────────────┐ │
│  • Transmission lines                │ │ ⚡ STORM          │ │
│  • Emergency incidents               │ │ Port Augusta     │ │
│  • Proximity rings                   │ └──────────────────┘ │
│  • SAPN outage zones                 │ ┌──────────────────┐ │
│                                      │ │ 🚗 ACCIDENT       │ │
│                                      │ │ Barossa Valley   │ │
│                                      │ └──────────────────┘ │
│                                      │                      │
│  [Powered by emergencyAPI.com] 🔴    │  [+ 4 more]         │
└──────────────────────────────────────┴─────────────────────┘
```

## Colour Palette

Dark ops theme — looks great on a large screen, reduced eye strain, professional.

```
Background:        #0a0f1a  (near-black navy)
Surface:           #111827  (card backgrounds)
Surface elevated:  #1e2533  (panels, KPI strip)
Border:            #2d3748  (subtle dividers)

Text primary:      #f1f5f9  (white-ish)
Text secondary:    #94a3b8  (labels, metadata)
Text muted:        #475569  (timestamps, minor info)

Accent blue:       #3b82f6  (normal infrastructure, selected states)
Accent green:      #22c55e  (healthy/online status)

Alert red:         #ef4444  (active fire, highest severity)
Alert orange:      #f97316  (storm, high severity / EXTREME fire danger)
Alert yellow:      #eab308  (flood, medium severity / assets at risk)
Alert purple:      #8b5cf6  (rescue, other incidents)
Alert blue:        #60a5fa  (accident, road incident)
```

## KPI Strip (Top Bar)

Five tiles across the full width, always visible:

| Tile | Data Source | Colour Logic |
|------|-------------|--------------|
| Active Incidents | emergencyAPI.com count | Red if >0, grey if 0 |
| Fire Danger | AFDRS rating (or derived from CFS data) | Red=Catastrophic, Orange=Extreme, Yellow=High, Green=Moderate |
| Assets At Risk | Proximity calc — substations within 5km of incident | Orange if >0 |
| Nearest Incident | Distance from any incident to nearest substation | Colour by severity |
| Last Updated | Timestamp of most recent emergencyAPI.com poll | Green=fresh, Yellow=stale >2min |

Each tile has:
- A large number or status value (prominent)
- A small label below (uppercase, muted)
- A top border colour strip matching the alert level
- Subtle pulse animation when the value changes

## Map Layers

### Base Map
- Style: `mapbox://styles/mapbox/dark-v11`
- Initial centre: Adelaide `[138.6, -34.9]`, zoom 6
- Controls: zoom in/out only (no rotation for the showcase)

### Transmission Lines Layer
- Source: Geoscience Australia MapServer layer 2
- Style: Semi-transparent blue lines, 1.5px width
- Opacity: 0.4 (subtle, contextual)
- Not clickable

### SAPN Outage Zones Layer
- Source: SAPN outage feed
- Style: Semi-transparent orange/red fill polygons
- Opacity: 0.25 fill, 0.6 stroke
- Clickable → shows outage details in a tooltip

### Substation Icons Layer
- Source: Geoscience Australia MapServer layer 0
- **3D Mapbox model layer** using a GLB transformer/substation model from Sketchfab
- Normal state: Blue glow, small scale
- At-risk state: Red/orange pulse animation, slightly larger scale
- Clickable → shows substation name, voltage, nearest incident distance

### Proximity Rings Layer
- Generated client-side from proximity calculations
- Dashed circle (radius = proximity threshold) around each incident that has a substation within range
- Colour matches the incident severity
- Animated — subtle expanding ring pulse

### Incident Markers Layer
- Source: emergencyAPI.com live data
- Circular markers, colour by incident type:
  - 🔴 Bushfire → red (`#ef4444`)
  - 🟠 Storm → orange (`#f97316`)
  - 🟡 Flood → yellow (`#eab308`)
  - 🟣 Rescue → purple (`#8b5cf6`)
  - 🔵 Accident → blue (`#60a5fa`)
- Active/watch/advice levels reflected in marker size
- Outer pulse ring for Emergency Warning level
- Clickable → expands incident card with full details + proximity info

### Powered By Badge
- Bottom-left corner of map
- `● Powered by emergencyAPI.com` — small, white on dark, with a live green dot
- Links to emergencyapi.com

## Incident Feed (Right Panel)

Scrollable list of live incidents, sorted by:
1. Proximity to infrastructure (closest first)
2. Then by severity
3. Then by most recent

Each card shows:
- Incident type icon + colour
- Title / location name
- Distance to nearest substation (e.g., "2.1km from Meadows Sub")
- Agency source (CFS, SES, MFS)
- Time since update
- Severity badge (Emergency Warning / Watch & Act / Advice)

Clicking a card → flies the map to that incident and opens a detail tooltip.

## Animations & Transitions

For the video recording, these moments should be visually compelling:
- **On load:** Substations and transmission lines fade in progressively
- **New incident:** Marker appears with a quick scale-up + pulse ring
- **At-risk substation:** Colour transitions from blue → red with glow
- **KPI value change:** Number counts up/down with a subtle flash
- **Map fly-to:** Smooth camera animation when clicking an incident card

## Typography

```
Font: system-ui / -apple-system (no custom font needed — fast load)
KPI values: font-size: 1.8rem, font-weight: 700
KPI labels: font-size: 0.65rem, uppercase, letter-spacing
Incident titles: font-size: 0.9rem, font-weight: 600
Body text: font-size: 0.82rem
Timestamps: font-size: 0.7rem, muted colour
```

## Responsive Design

Optimised for **1920×1080 fullscreen** (screen recording target). Does not need to be fully mobile responsive — this is a showcase app, not a consumer product. A minimum viable responsive breakpoint at 1280px wide is sufficient.
