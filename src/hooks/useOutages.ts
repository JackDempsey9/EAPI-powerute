'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchOutages } from '@/lib/sapnOutage'
import type { Outage } from '@/lib/types'

const POLL_INTERVAL_MS = 5 * 60_000  // 5 minutes — outages change slowly

interface OutageState {
  outages: Outage[]
  isAvailable: boolean
}

export function useOutages(): OutageState {
  const [state, setState] = useState<OutageState>({ outages: [], isAvailable: false })

  const poll = useCallback(async () => {
    const outages = await fetchOutages()
    setState({ outages, isAvailable: outages.length > 0 })
  }, [])

  useEffect(() => {
    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [poll])

  return state
}
