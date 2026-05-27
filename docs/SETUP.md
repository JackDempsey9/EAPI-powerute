# Setup & Installation

## Prerequisites

- Node.js 20+ (LTS)
- npm or pnpm
- A Mapbox account (free) — [mapbox.com](https://mapbox.com)
- An emergencyAPI.com account (free) — [emergencyapi.com](https://emergencyapi.com)
- The SAPN outage feed URL (from project owner)
- Vercel account (free) for deployment — [vercel.com](https://vercel.com)

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your API keys — see `docs/SECRETS.md` for where to get each one.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

The map should load centred on South Australia with live emergency data.

## Environment Variables

All environment variables are documented in `.env.example`:

```bash
# Mapbox — map tiles and rendering
NEXT_PUBLIC_MAPBOX_TOKEN=

# emergencyAPI.com — live emergency incidents
NEXT_PUBLIC_EMERGENCY_API_KEY=

# SAPN outage feed — provided by project owner
SAPN_OUTAGE_FEED_URL=
```

`NEXT_PUBLIC_` prefix means the variable is exposed to the browser. This is intentional — both Mapbox and emergencyAPI.com tokens are designed for client-side use (restrict Mapbox token to your domain in the Mapbox dashboard).

## Deployment to Vercel

### First deploy (via CLI)

```bash
npm install -g vercel
vercel login
vercel deploy
```

Follow the prompts. When asked about environment variables, add them via the Vercel dashboard after first deploy.

### Set environment variables in Vercel

```bash
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
vercel env add NEXT_PUBLIC_EMERGENCY_API_KEY
vercel env add SAPN_OUTAGE_FEED_URL
```

Or set them in the Vercel dashboard under Project → Settings → Environment Variables.

### Subsequent deploys

```bash
vercel deploy --prod
```

Or connect the GitHub repo for automatic deploys on push.

## Project Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build
npm run start      # Start production server locally
npm run lint       # Run ESLint
npm run type-check # TypeScript type check
```

## Mapbox Setup Notes

1. Create a free account at [mapbox.com](https://mapbox.com)
2. Go to Account → Tokens
3. Create a new token with scope: `styles:read`, `tiles:read`
4. Add URL restrictions to your domain (prevents token abuse)
5. For local dev, add `http://localhost:3000` to allowed URLs

## emergencyAPI.com Setup Notes

1. Sign up at [emergencyapi.com](https://emergencyapi.com)
2. No credit card required for free tier (500 req/day)
3. Retrieve your API key from the dashboard
4. Free tier is sufficient for development and recording the showcase

## SAPN Outage Feed Notes

URL to be provided by project owner. If the feed requires CORS proxying, a Next.js API route at `/api/outages` will proxy the request server-side.

## 3D Substation Model Setup

The 3D substation GLB model needs to be placed in the `public/models/` directory:

1. Download a free electrical substation/transformer model from Sketchfab (GLB format)
   - Recommended: search "electrical transformer substation" on sketchfab.com, filter by free + downloadable
2. Place the `.glb` file at `public/models/substation.glb`
3. The `SubstationLayer` component references this path

Fallback: if no 3D model is available, substations render as 2D glowing circles (also looks good).

## Troubleshooting

**Map doesn't load:**
- Check `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `.env.local`
- Check Mapbox token URL restrictions include `localhost:3000`

**No incidents showing:**
- Check `NEXT_PUBLIC_EMERGENCY_API_KEY` is set
- Open browser DevTools → Network tab → look for requests to `emergencyapi.com`
- Confirm the API key is valid at emergencyapi.com dashboard

**SAPN outage layer not showing:**
- Check `SAPN_OUTAGE_FEED_URL` is set
- The app degrades gracefully — a "Outage data unavailable" message shows if the feed fails
- Check browser console for CORS errors (may need API route proxy)
