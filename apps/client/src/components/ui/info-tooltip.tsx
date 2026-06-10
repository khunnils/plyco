import { Info, ShieldAlert } from "lucide-react"

export const InfoTooltip = ({ text }: { text: string }) => (
  <span className="group relative inline-flex">
    <button
      aria-label={text}
      className="inline-flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:bg-slate-100 focus-visible:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
      type="button"
    >
      <Info className="size-3.5" />
    </button>
    <span
      className="pointer-events-none absolute right-0 top-6 z-20 hidden w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-normal leading-5 text-slate-600 shadow-lg group-hover:block group-focus-within:block"
      role="tooltip"
    >
      {text}
    </span>
  </span>
)

export const SensitiveTooltip = () => (
  <span className="group relative inline-flex">
    <button
      aria-label="Sensitive data"
      className="inline-flex size-5 items-center justify-center rounded-full text-amber-600 transition hover:bg-amber-50 hover:text-amber-700 focus-visible:bg-amber-50 focus-visible:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100"
      type="button"
      onClick={(e) => e.stopPropagation()}
    >
      <ShieldAlert className="size-4" />
    </button>
    <span
      className="pointer-events-none absolute right-0 top-6 z-20 hidden w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-normal leading-5 text-slate-600 shadow-lg group-hover:block group-focus-within:block"
      role="tooltip"
    >
      <strong className="block font-semibold text-slate-900 mb-0.5">Sensitive</strong>
      Whether this data needs extra care because misuse could create higher risk.
    </span>
  </span>
)
