import { Plus, Save, Trash2 } from "lucide-react"
import { useState } from "react"
import { type Vocabulary, type VocabularyCodeInput } from "@complyflow/shared"

import { Button } from "@/components/ui/button"

export const VocabularyManager = ({
  isSaving,
  vocabulary,
  onCreateCode,
  onDeleteCode,
  onUpdateCode,
}: {
  isSaving: boolean
  vocabulary: Vocabulary | undefined
  onCreateCode: (codeSetId: string, code: VocabularyCodeInput) => void
  onDeleteCode: (codeSetId: string, codeId: string) => void
  onUpdateCode: (
    codeSetId: string,
    codeId: string,
    code: VocabularyCodeInput,
  ) => void
}) => {
  const [drafts, setDrafts] = useState<Record<string, VocabularyCodeInput>>({})
  const codeSets =
    vocabulary?.codeSets.filter((codeSet) => !codeSet.isSystem) ?? []

  if (!vocabulary) {
    return <p className="text-sm text-slate-500">Loading vocabulary...</p>
  }

  if (codeSets.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No organization vocabularies are available.
      </p>
    )
  }

  return (
    <div className="grid gap-4">
      {codeSets.map((codeSet) => {
        const draft = drafts[codeSet.codeSetId] ?? {
          codeId: "",
          name: "",
          active: true,
        }

        return (
          <div
            className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4"
            key={codeSet.id}
          >
            <div>
              <h3 className="font-semibold text-slate-950">{codeSet.name}</h3>
              {codeSet.description ? (
                <p className="mt-1 text-sm text-slate-500">
                  {codeSet.description}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              {codeSet.codes.map((code) => (
                <div
                  className="grid gap-2 rounded-md bg-slate-50 p-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
                  key={code.id}
                >
                  <input
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={code.codeId}
                    onChange={(event) =>
                      onUpdateCode(codeSet.codeSetId, code.codeId, {
                        codeId: event.target.value,
                        name: code.name,
                        active: code.active,
                      })
                    }
                  />
                  <input
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={code.name}
                    onChange={(event) =>
                      onUpdateCode(codeSet.codeSetId, code.codeId, {
                        codeId: code.codeId,
                        name: event.target.value,
                        active: code.active,
                      })
                    }
                  />
                  <Button
                    disabled={isSaving}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      onUpdateCode(codeSet.codeSetId, code.codeId, {
                        codeId: code.codeId,
                        name: code.name,
                        active: !code.active,
                      })
                    }
                  >
                    {code.active ? "Active" : "Inactive"}
                  </Button>
                  <Button
                    disabled={isSaving}
                    type="button"
                    variant="outline"
                    onClick={() => onDeleteCode(codeSet.codeSetId, code.codeId)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid gap-2 rounded-md border border-dashed border-slate-300 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                placeholder="code_id"
                value={draft.codeId}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [codeSet.codeSetId]: {
                      ...draft,
                      codeId: event.target.value,
                    },
                  }))
                }
              />
              <input
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                placeholder="Display name"
                value={draft.name}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [codeSet.codeSetId]: {
                      ...draft,
                      name: event.target.value,
                    },
                  }))
                }
              />
              <Button
                disabled={isSaving || !draft.codeId.trim() || !draft.name.trim()}
                type="button"
                onClick={() => {
                  onCreateCode(codeSet.codeSetId, draft)
                  setDrafts((current) => ({
                    ...current,
                    [codeSet.codeSetId]: {
                      codeId: "",
                      name: "",
                      active: true,
                    },
                  }))
                }}
              >
                {isSaving ? <Save /> : <Plus />}
                Add code
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
