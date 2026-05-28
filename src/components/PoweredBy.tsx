import { Radio } from 'lucide-react'

export function PoweredBy() {
  return (
    <a
      href="https://emergencyapi.com"
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-8 left-3 z-10 flex items-center gap-2 bg-[#0a0f1ae6] backdrop-blur-md border border-slate-600/50 rounded-lg px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer group"
    >
      <Radio size={14} className="text-red-400 group-hover:text-red-300 transition-colors" />
      <div className="flex flex-col">
        <span className="font-semibold text-slate-200 group-hover:text-white transition-colors leading-tight">emergencyAPI.com</span>
        <span className="text-[9px] text-slate-500 leading-tight">Live incident data</span>
      </div>
    </a>
  )
}
