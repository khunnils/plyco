import { type ReactNode } from "react"

export const PageHeader = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: ReactNode
}) => (
  <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center mb-6">
    <div>
      <p className="text-sm font-semibold text-blue-700">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
    </div>
    {children}
  </header>
)
