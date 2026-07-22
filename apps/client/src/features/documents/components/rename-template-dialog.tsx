import { Button } from "@/components/ui/button"

export const RenameTemplateDialog = ({
  templateName,
  onClose,
  onRename,
}: {
  templateName: string
  onClose: () => void
  onRename: (name: string) => void
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
    <div className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl duration-150">
      <h3 className="text-lg font-semibold text-slate-950">Rename template</h3>
      <p className="mt-1 text-sm text-slate-500">
        Enter a new name for this policy template.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          const newName = (formData.get("name") as string)?.trim()
          if (newName) {
            onRename(newName)
          }
          onClose()
        }}
        className="mt-4 grid gap-4"
      >
        <input
          autoComplete="new-password"
          name="name"
          type="text"
          defaultValue={templateName}
          required
          autoFocus
          className="field-focus-compact h-11 w-full rounded-sm border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition outline-none"
          placeholder="Template name"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Rename</Button>
        </div>
      </form>
    </div>
  </div>
)
