'use client'

import { useState, useEffect } from 'react'
import { fetchSubstations, fetchTransmissionLines } from '@/lib/geoscienceApi'
import type { Substation, TransmissionLine } from '@/lib/types'

interface SubstationState {
  substations: Substation[]
  transmissionLines: TransmissionLine[]
  isLoading: boolean
  error: string | null
}

export function useSubstations(): SubstationState {
  const [state, setState] = useState<SubstationState>({
    substations: [],
    transmissionLines: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchSubstations(), fetchTransmissionLines()])
      .then(([substations, transmissionLines]) => {
        if (!cancelled) {
          setState({ substations, transmissionLines, isLoading: false, error: null })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to load infrastructure data',
          }))
        }
      })

    return () => { cancelled = true }
  }, [])

  return state
}
