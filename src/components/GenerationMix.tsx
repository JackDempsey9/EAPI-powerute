'use client'

import { Activity } from 'lucide-react'
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
  return FUEL_COLOURS[fueltech] ?? '#64748b'
}

interface GenerationMixProps {
  data: GenerationMixData
}

export function GenerationMix({ data }: GenerationMixProps) {
  if (data.isLoading || data.error || data.sources.length === 0) return null

  const generating = data.sources.filter((s) => s.mw > 0)
  const barTotal = generating.reduce((sum, s) => sum + s.mw, 0)

  return (
    <div className="absolute bottom-8 right-3 z-10 w-56 bg-[#111827ee] backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700/40 flex items-center gap-2">
        <Activity size={12} className="text-green-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SA Generation</span>
        <span className="text-[10px] font-semibold text-slate-200 ml-auto tabular-nums">{Math.round(data.totalMw)} MW</span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 mx-3 mt-2 rounded-full overflow-hidden bg-slate-800">
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

      {/* Legend */}
      <div className="px-3 py-2 space-y-1">
        {generating.slice(0, 6).map((s) => (
          <div key={s.fueltech} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: getFuelColour(s.fueltech) }}
            />
            <span className="text-[10px] text-slate-400 flex-1 truncate">{formatFueltech(s.fueltech)}</span>
            <span className="text-[10px] text-slate-300 tabular-nums font-medium">{Math.round(s.mw)} MW</span>
          </div>
        ))}
      </div>

      <div className="px-3 pb-2">
        <div className="text-[9px] text-slate-600 text-center">
          Open Electricity | AEMO NEM | 5 min interval
        </div>
      </div>
    </div>
  )
}
