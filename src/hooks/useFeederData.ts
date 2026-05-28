'use client'

import { useState, useEffect } from 'react'
import { fetchSAPNDistributionFeeders } from '@/lib/sapnData'

export function useFeederData(): GeoJSON.FeatureCollection | null {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null)

  useEffect(() => {
    fetchSAPNDistributionFeeders()
      .then(setData)
      .catch((err) => console.warn('[useFeederData] Failed to load:', err))
  }, [])

  return data
}
