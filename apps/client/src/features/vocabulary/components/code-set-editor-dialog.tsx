import { useState } from "react"
import { Ellipsis, Pencil, Plus, Trash2, X } from "lucide-react"
import { type VocabularyCode, type VocabularyCodeInput } from "@plyco/shared"
import { usePostHog } from "@posthog/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useCreateVocabularyCode,
  useDeleteVocabularyCode,
  useUpdateVocabularyCode,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import { type CodeSetChange } from "@/features/vocabulary/lib/vocabulary"

const emptyCode = (): VocabularyCodeInput => ({
  codeId: "",
  name: "",
  description: "",
  active: true,
})

const inputFor = (code: VocabularyCode): VocabularyCodeInput => ({
  codeId: code.codeId,
  name: code.name,
  description: code.description,
  active: code.active,
})

export const CodeSetEditorDialog = ({
  codeSetId,
  isOpen,
  onChange,
  onClose,
}: {
  codeSetId: string
  isOpen: boolean
  onChange?: (change: CodeSetChange) => void
  onClose: () => void
}) => {
  const posthog = usePostHog()
  const vocabulary = useVocabulary(isOpen)
  const createCode = useCreateVocabularyCode()
  const updateCode = useUpdateVocabularyCode()
  const deleteCode = useDeleteVocabularyCode()
  const codeSet = vocabulary.data?.codeSets.find(
    (candidate) => candidate.codeSetId === codeSetId
  )
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null)
  const [draft, setDraft] = useState<VocabularyCodeInput>(emptyCode)

  if (!isOpen || !codeSet || codeSet.isSystem) return null

  const isSaving =
    createCode.isPending || updateCode.isPending || deleteCode.isPending
  const isEditing = editingCodeId !== null
  const resetForm = () => {
    setEditingCodeId(null)
    setDraft(emptyCode())
  }
  const closeDialog = () => {
    resetForm()
    onClose()
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
    >
      <div className="flex h-[42rem] max-h-[calc(100svh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Edit {codeSet.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Changes apply to selectors throughout this workspace.
            </p>
          </div>
          <Button
            aria-label="Close"
            size="icon-sm"
            variant="ghost"
            onClick={closeDialog}
          >
            <X />
          </Button>
        </header>

        <section className="shrink-0 border-b border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {isEditing ? "Edit code" : "Add code"}
              </h3>
              {isEditing ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  Editing {editingCodeId}
                </p>
              ) : null}
            </div>
            {isEditing ? (
              <Button size="sm" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-[10rem_1fr_1.5fr_auto]">
            <Input
              autoComplete="new-password"
              aria-label="Code ID"
              className="bg-white font-mono"
              placeholder="code_id"
              value={draft.codeId}
              onChange={(event) =>
                setDraft({ ...draft, codeId: event.target.value })
              }
            />
            <Input
              autoComplete="new-password"
              aria-label="Display name"
              className="bg-white"
              placeholder="Display name"
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
            <Input
              autoComplete="new-password"
              aria-label="Description"
              className="bg-white"
              placeholder="Description"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
            <div className="flex items-center justify-end gap-2">
              {isEditing ? (
                <Button
                  size="sm"
                  variant={draft.active ? "outline" : "secondary"}
                  onClick={() => setDraft({ ...draft, active: !draft.active })}
                >
                  {draft.active ? "Active" : "Inactive"}
                </Button>
              ) : null}
              <Button
                disabled={
                  isSaving || !draft.codeId.trim() || !draft.name.trim()
                }
                onClick={async () => {
                  if (editingCodeId) {
                    const updated = await updateCode.mutateAsync({
                      codeSetId,
                      codeId: editingCodeId,
                      code: draft,
                    })
                    posthog.capture(POSTHOG_EVENTS.VOCABULARY_CODE_UPDATED, {
                      code_set_id: codeSetId,
                      code_id: updated.codeId,
                    })
                    onChange?.({
                      type: "update",
                      previousCodeId: editingCodeId,
                      code: updated,
                    })
                  } else {
                    const created = await createCode.mutateAsync({
                      codeSetId,
                      code: draft,
                    })
                    posthog.capture(POSTHOG_EVENTS.VOCABULARY_CODE_CREATED, {
                      code_set_id: codeSetId,
                      code_id: created.codeId,
                    })
                  }
                  resetForm()
                }}
              >
                {isEditing ? <Pencil /> : <Plus />}
                {isEditing ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </section>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="overflow-hidden rounded-md border border-slate-200">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50">
                <TableRow className="hover:bg-slate-50">
                  <TableHead>Code ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codeSet.codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {code.codeId}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {code.name}
                    </TableCell>
                    <TableCell className="max-w-sm text-slate-500">
                      <span className="line-clamp-2">
                        {code.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.active ? "outline" : "secondary"}>
                        {code.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label={`Actions for ${code.name}`}
                            disabled={isSaving}
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Ellipsis />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingCodeId(code.codeId)
                              setDraft(inputFor(code))
                            }}
                          >
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={async () => {
                              await deleteCode.mutateAsync({
                                codeSetId,
                                codeId: code.codeId,
                              })
                              posthog.capture(
                                POSTHOG_EVENTS.VOCABULARY_CODE_DELETED,
                                {
                                  code_set_id: codeSetId,
                                  code_id: code.codeId,
                                }
                              )
                              onChange?.({
                                type: "delete",
                                codeId: code.codeId,
                              })
                              if (editingCodeId === code.codeId) resetForm()
                            }}
                          >
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
