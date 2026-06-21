import { Info, ShieldAlert } from "lucide-react"

export const InfoTooltip = ({ text }: { text: string }) => (
  <span className="group relative inline-flex">
    <button
      aria-label={text}
      className="inline-flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:bg-slate-100 focus-visible:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-100 focus-visible:outline-none"
      type="button"
    >
      <Info className="size-3.5" />
    </button>
    <span
      className="pointer-events-none absolute top-6 right-0 z-20 hidden w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 font-normal text-slate-600 shadow-lg group-focus-within:block group-hover:block"
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
      className="inline-flex size-5 items-center justify-center rounded-full text-amber-600 transition hover:bg-amber-50 hover:text-amber-700 focus-visible:bg-amber-50 focus-visible:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-100 focus-visible:outline-none"
      type="button"
      onClick={(e) => e.stopPropagation()}
    >
      <ShieldAlert className="size-4" />
    </button>
    <span
      className="pointer-events-none absolute top-6 right-0 z-20 hidden w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 font-normal text-slate-600 shadow-lg group-focus-within:block group-hover:block"
      role="tooltip"
    >
      <strong className="mb-0.5 block font-semibold text-slate-900">
        Sensitive
      </strong>
      Whether this data needs extra care because misuse could create higher
      risk.
    </span>
  </span>
)
