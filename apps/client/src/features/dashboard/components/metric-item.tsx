import { type ReactNode } from "react"

export const MetricItem = ({
  description,
  label,
  value,
}: {
  description: string
  label: string
  value: ReactNode
}) => (
  <div className="border border-slate-200 bg-white p-8 flex flex-col justify-between">
    <div className="flex flex-col gap-1 items-center text-center">
      <h2 className="text-4xl font-semibold text-slate-950">
        {value}
      </h2>
      <p className="text-sm font-semibold text-primary">
        {label}
      </p>
      <p className="text-xs text-slate-500">
        {description}
      </p>
    </div>
  </div>
)
