#!/usr/bin/env node

/**
 * Uses Playwright to load the SAPN outage map in a real browser,
 * pass the Imperva WAF challenge, and capture all network requests
 * to discover the outage data API endpoint.
 */

import { chromium } from 'playwright';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  const captured = [];

  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();
    if (url.includes('sapowernetworks') || url.includes('outage')) {
      const postData = req.postData();
      captured.push({
        method,
        url,
        headers: req.headers(),
        postData: postData ? postData.substring(0, 500) : null,
      });
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    const status = res.status();
    const contentType = res.headers()['content-type'] || '';

    if ((url.includes('sapowernetworks') || url.includes('outage')) &&
        (contentType.includes('json') || contentType.includes('javascript'))) {
      try {
        const body = await res.text();
        console.log(`\n=== RESPONSE: ${res.request().method()} ${url} ===`);
        console.log(`Status: ${status} | Content-Type: ${contentType}`);
        console.log(`Body (first 1000 chars): ${body.substring(0, 1000)}`);
      } catch {}
    }
  });

  console.log('Loading outage map page...');
  await page.goto('https://outage.apps.sapowernetworks.com.au/OutageReport/OutageMap', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  console.log('Page loaded. Waiting for map data to load...');
  await page.waitForTimeout(10000);

  console.log(`\n=== ALL CAPTURED REQUESTS (${captured.length}) ===\n`);
  for (const req of captured) {
    const isData = req.url.includes('api') || req.url.includes('Outage') || req.url.includes('Map') || req.url.includes('json');
    if (isData || req.method === 'POST') {
      console.log(`${req.method} ${req.url}`);
      if (req.postData) console.log(`  POST data: ${req.postData}`);
      console.log();
    }
  }

  console.log('\n=== ALL UNIQUE URLS ===\n');
  const uniqueUrls = [...new Set(captured.map(r => r.url))].sort();
  for (const url of uniqueUrls) {
    console.log(url);
  }

  await browser.close();
}

main().catch(console.error);
