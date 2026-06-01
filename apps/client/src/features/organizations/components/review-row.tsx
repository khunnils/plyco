import { type ReactNode } from "react"

export const ReviewRow = ({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) => (
  <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-slate-950">{value}</p>
  </div>
)
