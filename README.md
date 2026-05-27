# EmergencyAPI Power Utility Showcase

A live, screen-recordable web dashboard that showcases [emergencyAPI.com](https://emergencyapi.com) as supplementary real-time emergency data for Australian power utilities.

Built to demonstrate how utilities can integrate emergencyAPI.com into their existing operational platforms — showing live incidents (bushfires, storms, floods, accidents) overlaid on real South Australian electricity infrastructure.

## What This Is

A **War Room**-style operations dashboard running in the browser, populated with:

- 🔴 **Live emergency incidents** from emergencyAPI.com (CFS, SES, MFS feeds)
- 🏗️ **Real SA substations & transmission lines** from Geoscience Australia
- ⚡ **SAPN outage data** (current outages across SA)
- 📍 **Proximity alerts** — incidents within configurable distance of infrastructure

Designed to be screen-recorded for a YouTube showcase video.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in API keys — see docs/SECRETS.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Docs

| File | Contents |
|------|----------|
| [docs/GOAL.md](docs/GOAL.md) | Product vision, target audience, success criteria |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, component structure, data flow |
| [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md) | All APIs, endpoints, formats, rate limits |
| [docs/DESIGN.md](docs/DESIGN.md) | UI layout, visual design, War Room spec |
| [docs/SETUP.md](docs/SETUP.md) | Installation, environment, deployment |
| [docs/SECRETS.md](docs/SECRETS.md) | API keys needed and where to get them |
| [docs/SHOWCASE.md](docs/SHOWCASE.md) | What to demonstrate, key features, video plan |

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Map:** Mapbox GL JS
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Data:** emergencyAPI.com · Geoscience Australia · SAPN outage feed

## Live URL

Deployed at: https://eapi-sapn-showcase.vercel.app
