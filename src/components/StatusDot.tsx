interface StatusDotProps {
  isConnected: boolean
  isStale?: boolean
}

export function StatusDot({ isConnected, isStale }: StatusDotProps) {
  const colour = !isConnected
    ? 'bg-red-500'
    : isStale
    ? 'bg-yellow-400'
    : 'bg-green-400'

  return (
    <span className="relative flex h-2 w-2">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colour} opacity-75`}
      />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colour}`} />
    </span>
  )
}
