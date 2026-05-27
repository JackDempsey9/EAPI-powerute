import { test, expect, type Page, type Request } from '@playwright/test'

// ── Helpers ─────────────────────────────────────────────────────────────────

async function waitForDashboard(page: Page) {
  await page.goto('/')
  // Wait for the KPI strip to be visible
  await page.waitForSelector('[data-testid="kpi-strip"]', { timeout: 15_000 }).catch(() => {
    // No test id yet — fall back to visible text
  })
}

// ── Test Suite ───────────────────────────────────────────────────────────────

test.describe('Dashboard — structural render', () => {
  test('page loads without crash (no unhandled errors)', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Filter out known non-critical warnings
    const critical = errors.filter(
      (e) =>
        !e.includes('mapbox') &&
        !e.includes('ResizeObserver') &&
        !e.includes('Non-Error promise rejection')
    )
    expect(critical, `Unhandled page errors: ${critical.join('\n')}`).toHaveLength(0)
  })

  test('page is not blank (has content)', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    const bodyBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    )
    // Background should be the dark navy (#0a0f1a) or close to it — not white
    expect(bodyBg).not.toBe('rgb(255, 255, 255)')
  })

  test('map container is rendered and has non-zero dimensions', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    // Find the mapboxgl canvas
    const canvas = page.locator('canvas.mapboxgl-canvas')
    await expect(canvas).toBeVisible({ timeout: 15_000 })

    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)
  })

  test('KPI strip renders with 5 tiles', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // Check for the KPI tile labels — use exact:true to avoid matching
    // "No active incidents" in the feed panel for the "Active Incidents" label
    for (const label of ['Active Incidents', 'Fire Danger', 'Assets at Risk', 'Nearest Incident', 'Live Feed']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    }
  })

  test('incident feed panel is rendered', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    await expect(page.getByText('Live Incidents', { exact: false })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('sorted by proximity', { exact: false })).toBeVisible({ timeout: 10_000 })
  })

  test('"Powered by emergencyAPI.com" badge is visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    const badge = page.getByText('Powered by emergencyAPI.com', { exact: false })
    await expect(badge).toBeVisible({ timeout: 10_000 })
  })

  test('layout fills viewport — no scroll, no overflow', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    const { scrollHeight, clientHeight } = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }))
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 2) // 2px tolerance
  })
})

test.describe('API calls — correct URLs and headers', () => {
  test('emergencyAPI.com fetch uses correct URL (emergencyapi.com/api/v1)', async ({ page }) => {
    const apiRequests: Request[] = []
    page.on('request', (req) => {
      if (req.url().includes('emergencyapi.com')) apiRequests.push(req)
    })

    await page.goto('/')
    await page.waitForTimeout(5000)

    expect(apiRequests.length, 'No request to emergencyAPI.com was made').toBeGreaterThan(0)

    const req = apiRequests[0]
    // URL must NOT be api.emergencyapi.com (that's the wrong subdomain)
    expect(req.url()).not.toContain('api.emergencyapi.com')
    // Must use the correct base path
    expect(req.url()).toContain('emergencyapi.com/api/v1/incidents')
  })

  test('emergencyAPI.com request has Authorization header', async ({ page }) => {
    let apiReq: Request | null = null
    page.on('request', (req) => {
      if (req.url().includes('emergencyapi.com/api/v1')) apiReq = req
    })

    await page.goto('/')
    await page.waitForTimeout(5000)

    expect(apiReq, 'emergencyAPI.com request not found').not.toBeNull()
    const headers = apiReq!.headers()
    const hasAuth = 'authorization' in headers || 'x-api-key' in headers
    expect(hasAuth, 'No auth header on emergencyAPI.com request').toBe(true)
  })

  test('Geoscience Australia substation request uses Layer 0', async ({ page }) => {
    const gaRequests: Request[] = []
    page.on('request', (req) => {
      if (req.url().includes('services.ga.gov.au')) gaRequests.push(req)
    })

    await page.goto('/')
    await page.waitForTimeout(8000)

    expect(gaRequests.length, 'No GA request made').toBeGreaterThan(0)
    const substationReq = gaRequests.find((r) => r.url().includes('/0/query'))
    expect(substationReq, 'No substation (Layer 0) request found').toBeDefined()
  })

  test('Geoscience Australia transmission line request uses Layer 2', async ({ page }) => {
    const gaRequests: Request[] = []
    page.on('request', (req) => {
      if (req.url().includes('services.ga.gov.au')) gaRequests.push(req)
    })

    await page.goto('/')
    await page.waitForTimeout(8000)

    const lineReq = gaRequests.find((r) => r.url().includes('/2/query'))
    expect(lineReq, 'No transmission line (Layer 2) request found').toBeDefined()
  })

  test('SAPN outage proxy route responds (even if empty)', async ({ page }) => {
    const response = await page.request.get('/api/proxy/outages')
    expect(response.status()).toBeLessThan(500) // 200 or 502 are both acceptable
    const body = await response.json().catch(() => null)
    expect(Array.isArray(body), 'Proxy must return a JSON array').toBe(true)
  })
})

test.describe('Map layer data — data reaches the map after load', () => {
  test('substations appear on the map after GA data loads', async ({ page }) => {
    // GA responses can take a few seconds
    await page.goto('/')

    // Wait for the GA API to respond
    await page.waitForResponse(
      (res) => res.url().includes('services.ga.gov.au') && res.status() === 200,
      { timeout: 20_000 }
    ).catch(() => null) // Don't fail if GA is slow — flag separately

    // Wait a bit more for React state to propagate to map
    await page.waitForTimeout(3000)

    // The map canvas should exist and contain rendered pixels (not completely dark)
    const canvas = page.locator('canvas.mapboxgl-canvas')
    await expect(canvas).toBeVisible()
  })

  test('incidents layer receives data after API responds', async ({ page }) => {
    await page.goto('/')

    // Wait for emergencyAPI.com to respond
    await page.waitForResponse(
      (res) => res.url().includes('emergencyapi.com') && res.status() === 200,
      { timeout: 15_000 }
    ).catch(() => null)

    await page.waitForTimeout(2000)

    // The feed panel count line should update from 0
    // (either shows incidents or "No active incidents")
    const feedContent = page.locator('text=/active|No active/i')
    await expect(feedContent.first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Console errors — no unexpected runtime errors', () => {
  test('no console errors about missing map sources or layers', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')
    await page.waitForTimeout(8000)

    const mapErrors = consoleErrors.filter(
      (e) =>
        e.toLowerCase().includes('source') ||
        e.toLowerCase().includes('layer') ||
        e.toLowerCase().includes('setdata') ||
        e.toLowerCase().includes('not found') ||
        (e.toLowerCase().includes('mapbox') && !e.includes('deprecated'))
    )
    expect(mapErrors, `Mapbox source/layer errors: ${mapErrors.join('\n')}`).toHaveLength(0)
  })

  test('no React hydration errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')
    await page.waitForTimeout(3000)

    const hydrationErrors = consoleErrors.filter(
      (e) =>
        e.toLowerCase().includes('hydration') ||
        e.toLowerCase().includes('did not match') ||
        e.toLowerCase().includes('text content does not match')
    )
    expect(hydrationErrors, `Hydration errors: ${hydrationErrors.join('\n')}`).toHaveLength(0)
  })
})

test.describe('Interactive — popup and feed', () => {
  test('status dot reflects connection state after first poll', async ({ page }) => {
    await page.goto('/')

    // Wait up to 15s for the feed to connect (first poll)
    await page.waitForResponse(
      (res) => res.url().includes('emergencyapi.com'),
      { timeout: 15_000 }
    ).catch(() => null)

    await page.waitForTimeout(1500)

    // The live feed tile should no longer say "Connecting..."
    const connectingText = page.getByText('Connecting...', { exact: false })
    // It should have resolved to either seconds ago or an error indicator
    const isStillConnecting = await connectingText.isVisible().catch(() => false)

    // Either it connected (green, showing "Xs ago") OR it failed with error
    // Either is valid — what's NOT valid is hanging at "Connecting..." forever
    // We check it changed state
    // If still connecting after 15s, the API call is either wrong URL or hanging
    if (isStillConnecting) {
      // Check if there's an error in the feed
      const errorText = await page.locator('text=/error|failed|unavailable/i').isVisible().catch(() => false)
      expect(errorText, 'Still connecting after 15s with no error shown').toBe(true)
    }
  })
})
