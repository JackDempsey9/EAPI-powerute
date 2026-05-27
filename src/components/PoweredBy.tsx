export function PoweredBy() {
  return (
    <a
      href="https://emergencyapi.com"
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-8 left-3 z-10 flex items-center gap-1.5 bg-[#0a0f1acc] backdrop-blur-sm border border-slate-700 rounded-full px-3 py-1 text-xs text-slate-300 hover:text-white transition-colors"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      Powered by emergencyAPI.com
    </a>
  )
}
