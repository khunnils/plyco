import { Settings } from "lucide-react"

export const CodeSetEditButton = ({
  label,
  onEdit,
}: {
  label: string
  onEdit: () => void
}) => (
  <button
    aria-label={`Edit ${label} options`}
    title={`Edit ${label} options`}
    type="button"
    className="rounded-sm p-1 text-slate-400 opacity-0 transition group-hover/code-select:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
    onKeyDown={(event) => event.stopPropagation()}
    onMouseDown={(event) => event.preventDefault()}
    onClick={(event) => {
      event.preventDefault()
      event.stopPropagation()
      onEdit()
    }}
  >
    <Settings className="size-3.5" />
  </button>
)
