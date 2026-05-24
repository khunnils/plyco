export const ProgressBar = ({ percent }: { percent: number }) => (
  <div className="h-1.5 w-full overflow-hidden bg-slate-100">
    <div
      className="h-full bg-blue-600 transition-[width]"
      style={{ width: `${percent}%` }}
    />
  </div>
)
