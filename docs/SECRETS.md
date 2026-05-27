# API Keys & Secrets

⚠️ Never commit actual key values to git. This file documents what keys are needed and where to get them.

All keys go in `.env.local` (gitignored) for local development, and in Vercel Environment Variables for production.

---

## Required Keys

### NEXT_PUBLIC_MAPBOX_TOKEN

**What:** Mapbox GL JS public access token. Used for loading map tiles and rendering.

**How to get:**
1. Sign up / log in at [mapbox.com](https://mapbox.com)
2. Go to [account.mapbox.com](https://account.mapbox.com)
3. Scroll to "Access tokens"
4. Create a new token with scopes: `styles:read`, `tiles:read`
5. Add URL restrictions: your Vercel domain + `http://localhost:3000`

**Cost:** Free tier — 50,000 map loads/month free. More than enough for a showcase.

**Security:** Safe to expose client-side. Restrict to your domain to prevent abuse.

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiWU9VUi1VU0VSTkFNRSIsImEiOiJZT1VSLVRPSy...
```

---

### NEXT_PUBLIC_EMERGENCY_API_KEY

**What:** emergencyAPI.com API key. Used for fetching live Australian emergency incidents.

**How to get:**
1. Sign up at [emergencyapi.com](https://emergencyapi.com)
2. No credit card required
3. Retrieve your API key from the dashboard

**Cost:** Free tier — 500 requests/day. Sufficient for development and showcase recording.

**Rate limit notes:**
- 500 req/day free
- At 30s polling: ~2,880 req/day (exceeds free tier for 24/7 running)
- For showcase recording sessions only: 30s interval is fine (a few hours = ~360 requests)
- For ongoing/demo deployments: poll every 2–5 minutes to stay within free tier

**Security:** Safe to expose client-side (emergencyAPI.com data is public anyway).

```
NEXT_PUBLIC_EMERGENCY_API_KEY=your-api-key-here
```

---

### SAPN_OUTAGE_FEED_URL

**What:** SA Power Networks outage data feed URL. Provides current outage zones across SA.

**How to get:** Project owner has this URL from a previous project. To be provided.

**Status:** ⏳ Pending — owner to supply

**Note:** If this feed is not CORS-friendly (i.e., it blocks browser requests), we use a Next.js API route at `/api/outages` to proxy the request server-side. In that case, this variable is server-side only (no `NEXT_PUBLIC_` prefix) and is safe to keep private.

```
SAPN_OUTAGE_FEED_URL=https://...
```

---

## .env.example File

The following should exist at the project root as `.env.example` (committed to git as a template):

```bash
# Mapbox — map tiles and rendering
# Get from: https://account.mapbox.com
NEXT_PUBLIC_MAPBOX_TOKEN=

# emergencyAPI.com — live Australian emergency incidents (500 req/day free)
# Get from: https://emergencyapi.com
NEXT_PUBLIC_EMERGENCY_API_KEY=

# SAPN outage feed URL (provided by project owner)
SAPN_OUTAGE_FEED_URL=
```

---

## .gitignore

Ensure the following are gitignored (Next.js does this by default):
```
.env.local
.env.*.local
```

Never commit a file containing actual API key values.

---

## Vercel Environment Variables

After deploying to Vercel, add environment variables in:
**Vercel Dashboard → Project → Settings → Environment Variables**

Or via CLI:
```bash
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN production
vercel env add NEXT_PUBLIC_EMERGENCY_API_KEY production
vercel env add SAPN_OUTAGE_FEED_URL production
```

Select "Production", "Preview", and "Development" for each.
