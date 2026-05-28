/**
 * Centralised incident type metadata: colours and Lucide icon names.
 *
 * Colour rationale follows Australian emergency service conventions:
 *   Bushfire       - Red (CFS standard)
 *   Structure Fire - Amber (MFS, distinct from bushfire red)
 *   Storm          - Violet (BOM radar convention for severe weather)
 *   Flood          - Blue (water)
 *   Accident       - Orange (caution/warning)
 *   Rescue         - Teal (SAR, distinct from medical green)
 *   Medical        - Green (universal medical/health)
 *   Alarm          - Yellow (alert signal)
 *   Tree Down      - Lime (hazard category, vegetation)
 *   Other          - Slate (neutral)
 */

export const INCIDENT_META: Record<string, {
  hex: string
  tailwindText: string
  tailwindBorder: string
  tailwindBg: string
  icon: string
}> = {
  'Bushfire':        { hex: '#ef4444', tailwindText: 'text-red-400',    tailwindBorder: 'border-red-700',    tailwindBg: 'bg-[#1c0d0d]', icon: 'Flame' },
  'Structure Fire':  { hex: '#f59e0b', tailwindText: 'text-amber-400',  tailwindBorder: 'border-amber-700',  tailwindBg: 'bg-[#1a1508]', icon: 'Building2' },
  'Storm':           { hex: '#a78bfa', tailwindText: 'text-violet-400', tailwindBorder: 'border-violet-700', tailwindBg: 'bg-[#14101e]', icon: 'CloudLightning' },
  'Flood':           { hex: '#3b82f6', tailwindText: 'text-blue-400',   tailwindBorder: 'border-blue-700',   tailwindBg: 'bg-[#0b1020]', icon: 'Waves' },
  'Accident':        { hex: '#fb923c', tailwindText: 'text-orange-400', tailwindBorder: 'border-orange-700', tailwindBg: 'bg-[#1c1208]', icon: 'TriangleAlert' },
  'Rescue':          { hex: '#2dd4bf', tailwindText: 'text-teal-400',   tailwindBorder: 'border-teal-700',   tailwindBg: 'bg-[#091816]', icon: 'LifeBuoy' },
  'Medical':         { hex: '#4ade80', tailwindText: 'text-green-400',  tailwindBorder: 'border-green-700',  tailwindBg: 'bg-[#0a180d]', icon: 'Cross' },
  'Alarm':           { hex: '#facc15', tailwindText: 'text-yellow-400', tailwindBorder: 'border-yellow-700', tailwindBg: 'bg-[#1a1a09]', icon: 'BellRing' },
  'Tree Down':       { hex: '#fb923c', tailwindText: 'text-orange-400', tailwindBorder: 'border-orange-700', tailwindBg: 'bg-[#1c1208]', icon: 'TreeDeciduous' },
  'Other':           { hex: '#94a3b8', tailwindText: 'text-slate-400',  tailwindBorder: 'border-slate-600',  tailwindBg: 'bg-[#0f1219]', icon: 'CircleHelp' },
}

export const DEFAULT_META = INCIDENT_META['Other']
