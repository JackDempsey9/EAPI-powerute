'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchIncidents } from '@/lib/emergencyApi'
import type { Incident } from '@/lib/types'

const POLL_INTERVAL_MS = 30_000

interface FeedState {
  incidents: Incident[]
  lastUpdated: Date | null
  isConnected: boolean
  error: string | null
}

export function useEmergencyFeed(): FeedState {
  const [state, setState] = useState<FeedState>({
    incidents: [],
    lastUpdated: null,
    isConnected: false,
    error: null,
  })

  const apiKey = process.env.NEXT_PUBLIC_EMERGENCY_API_KEY ?? ''

  const poll = useCallback(async () => {
    try {
      const incidents = await fetchIncidents(apiKey)
      setState({
        incidents,
        lastUpdated: new Date(),
        isConnected: true,
        error: null,
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: err instanceof Error ? err.message : 'Failed to fetch incidents',
      }))
    }
  }, [apiKey])

  useEffect(() => {
    poll() // Initial fetch immediately
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [poll])

  return state
}
