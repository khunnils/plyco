export const ProgressBar = ({ percent }: { percent: number }) => (
  <div className="h-1.5 w-full overflow-hidden bg-slate-100">
    <div
      className={`h-full transition-[width] ${
        percent === 100 ? "bg-emerald-600" : "bg-blue-600"
      }`}
      style={{ width: `${percent}%` }}
    />
  </div>
)
