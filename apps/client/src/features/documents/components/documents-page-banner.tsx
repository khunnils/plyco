import { ArrowLeft } from "lucide-react"
import { type ReactNode } from "react"

import { Button } from "@/components/ui/button"

export const DocumentsPageBanner = ({
  title,
  subtitle,
  actions,
  onBack,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
  onBack?: () => void
}) => (
  <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex items-start gap-2">
      {onBack ? (
        <Button
          aria-label="Back to documents"
          className="-ml-2 text-slate-500"
          size="icon-sm"
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft />
        </Button>
      ) : null}
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
    {actions ? (
      <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
    ) : null}
  </div>
)
