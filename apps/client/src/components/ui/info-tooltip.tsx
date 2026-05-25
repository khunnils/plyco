import { Info } from "lucide-react"

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
