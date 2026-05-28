'use client'

import { useState, useEffect } from 'react'
import { fetchSAPNSubstations, fetchSAPNSubTransmissionLines } from '@/lib/sapnData'
import { fetchTransmissionLines } from '@/lib/geoscienceApi'
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

    // Load SAPN zone substations (local GeoJSON , 330 authoritative SAPN sites)
    // + ElectraNet HV transmission lines from Geoscience Australia (132kV/275kV backbone)
    // + SAPN 66kV sub-transmission lines (local GeoJSON , distribution feeders)
    Promise.all([
      fetchSAPNSubstations(),
      fetchTransmissionLines(),
      fetchSAPNSubTransmissionLines(),
    ])
      .then(([substations, electraNetLines, sapnLines]) => {
        const transmissionLines = [...electraNetLines, ...sapnLines]
        if (!cancelled) setState({ substations, transmissionLines, isLoading: false, error: null })
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
