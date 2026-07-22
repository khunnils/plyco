import { Pencil } from "lucide-react"
import { type ReactNode } from "react"

export const DocumentsPageBanner = ({
  title,
  subtitle,
  showRename = false,
  actions,
  onRenameClick,
}: {
  title: string
  subtitle: string
  showRename?: boolean
  actions?: ReactNode
  onRenameClick?: () => void
}) => (
  <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
        <span>{title}</span>
        {showRename ? (
          <button
            type="button"
            onClick={onRenameClick}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Rename template"
          >
            <Pencil className="size-3.5" />
          </button>
        ) : null}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
    {actions ? (
      <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
    ) : null}
  </div>
)
