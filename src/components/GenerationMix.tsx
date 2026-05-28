'use client'

import type { GenerationMix as GenerationMixData } from '@/hooks/useGenerationMix'
import { formatFueltech } from '@/hooks/useGenerationMix'

const FUEL_COLOURS: Record<string, string> = {
  gas_ccgt: '#f97316',
  gas_ocgt: '#fb923c',
  gas_recip: '#fdba74',
  gas_steam: '#ea580c',
  wind: '#22d3ee',
  solar_utility: '#facc15',
  solar_rooftop: '#fde047',
  battery: '#a78bfa',
  battery_discharging: '#a78bfa',
  distillate: '#94a3b8',
  coal_black: '#64748b',
  hydro: '#3b82f6',
  bioenergy: '#4ade80',
}

function getFuelColour(fueltech: string): string {
  return FUEL_COLOURS[fueltech] ?? '#3a5545'
}

interface GenerationMixProps {
  data: GenerationMixData
}

export function GenerationMix({ data }: GenerationMixProps) {
  if (data.isLoading || data.error || data.sources.length === 0) return null

  const generating = data.sources.filter((s) => s.mw > 0)
  const barTotal = generating.reduce((sum, s) => sum + s.mw, 0)

  return (
    <div className="absolute bottom-8 right-3 z-10 w-52 bg-[#0f1a16] border border-[#1e3530]">
      <div className="px-2.5 py-1.5 border-b border-[#1e3530] flex items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#5a7a65] font-mono">SA GENERATION</span>
        <span className="text-[10px] font-semibold text-[#c8e6d0] ml-auto tabular-nums font-mono">{Math.round(data.totalMw)} MW</span>
      </div>

      <div className="flex h-1 mx-2.5 mt-2 overflow-hidden bg-[#1e3530]">
        {generating.map((s) => (
          <div
            key={s.fueltech}
            style={{
              width: `${(s.mw / barTotal) * 100}%`,
              backgroundColor: getFuelColour(s.fueltech),
            }}
          />
        ))}
      </div>

      <div className="px-2.5 py-1.5 space-y-0.5">
        {generating.slice(0, 6).map((s) => (
          <div key={s.fueltech} className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 shrink-0"
              style={{ backgroundColor: getFuelColour(s.fueltech) }}
            />
            <span className="text-[9px] text-[#5a7a65] flex-1 truncate font-mono uppercase">{formatFueltech(s.fueltech)}</span>
            <span className="text-[9px] text-[#7a9a85] tabular-nums font-mono">{Math.round(s.mw)}</span>
          </div>
        ))}
      </div>

      <div className="px-2.5 pb-1.5">
        <div className="text-[8px] text-[#2a4540] font-mono uppercase tracking-wider">
          AEMO NEM | 5MIN
        </div>
      </div>
    </div>
  )
}
