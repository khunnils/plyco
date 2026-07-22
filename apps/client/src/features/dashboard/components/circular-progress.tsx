export const CircularProgress = ({
  percent,
  size = 20,
  strokeWidth = 2.5,
  className,
}: {
  percent: number
  size?: number
  strokeWidth?: number
  className?: string
}) => {
  const clamped = Math.min(100, Math.max(0, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <svg
      aria-hidden
      className={className}
      height={size}
      width={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        className="text-slate-200"
        cx={size / 2}
        cy={size / 2}
        fill="none"
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <circle
        className={clamped >= 100 ? "text-emerald-600" : "text-slate-600"}
        cx={size / 2}
        cy={size / 2}
        fill="none"
        r={radius}
        stroke="currentColor"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
