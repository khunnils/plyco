import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { type Vocabulary, type VocabularyCodeInput } from "@plyco/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
    code: VocabularyCodeInput
  ) => void
}) => {
  const [drafts, setDrafts] = useState<Record<string, VocabularyCodeInput>>({})
  const [filter, setFilter] = useState("")
  const [selectedCodeSetId, setSelectedCodeSetId] = useState<string | null>(
    null
  )
  const [isEditing, setIsEditing] = useState(false)

  const codeSets = useMemo(
    () => vocabulary?.codeSets.filter((codeSet) => !codeSet.isSystem) ?? [],
    [vocabulary]
  )

  const filteredCodeSets = useMemo(() => {
    const query = filter.trim().toLowerCase()

    if (!query) {
      return codeSets
    }

    return codeSets.filter((codeSet) => {
      const searchable = [
        codeSet.name,
        codeSet.codeSetId,
        codeSet.description ?? "",
        ...codeSet.codes.flatMap((code) => [code.codeId, code.name]),
      ]
        .join(" ")
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [codeSets, filter])

  if (!vocabulary) {
    return <p className="text-sm text-slate-500">Loading vocabulary...</p>
  }

  if (codeSets.length === 0) {
    return (
      <p className="border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No organization vocabularies are available.
      </p>
    )
  }

  const selectedCodeSet =
    filteredCodeSets.find(
      (codeSet) => codeSet.codeSetId === selectedCodeSetId
    ) ??
    filteredCodeSets[0] ??
    codeSets.find((codeSet) => codeSet.codeSetId === selectedCodeSetId) ??
    codeSets[0]

  const draft = drafts[selectedCodeSet.codeSetId] ?? {
    codeId: "",
    name: "",
    active: true,
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="bg-white">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-slate-950">Code sets</h2>
          <p className="mt-1 text-sm text-slate-500">
            Organization-owned vocabularies used by workspace records.
          </p>
          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="rounded-md border-slate-200 bg-white pl-9"
              placeholder="Filter code sets or codes"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </label>
        </div>

        <div className="max-h-[calc(100svh-16rem)] overflow-y-auto border-t border-slate-100">
          {filteredCodeSets.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              No code sets match this filter.
            </p>
          ) : (
            <div className="grid">
              {filteredCodeSets.map((codeSet) => {
                const isSelected =
                  codeSet.codeSetId === selectedCodeSet.codeSetId
                const activeCodes = codeSet.codes.filter(
                  (code) => code.active
                ).length

                return (
                  <button
                    className={cn(
                      "flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition",
                      isSelected
                        ? "bg-slate-100 text-slate-950"
                        : "bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                    )}
                    key={codeSet.id}
                    type="button"
                    onClick={() => {
                      setSelectedCodeSetId(codeSet.codeSetId)
                      setIsEditing(false)
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {codeSet.name}
                      </span>
                      <span className="mt-1 block truncate font-mono text-xs text-slate-500">
                        {codeSet.codeSetId}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {activeCodes}/{codeSet.codes.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      <section className="grid content-start gap-4">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {selectedCodeSet.name}
            </h2>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {selectedCodeSet.codeSetId}
            </p>
            {selectedCodeSet.description ? (
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                {selectedCodeSet.description}
              </p>
            ) : null}
          </div>
          <Button
            className="w-fit"
            size="sm"
            type="button"
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <X /> Done
              </>
            ) : (
              <>
                <Pencil /> Edit
              </>
            )}
          </Button>
        </div>

        {isEditing ? (
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-3 font-medium">Code ID</th>
                  <th className="px-3 py-3 font-medium">Display name</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="py-3 pl-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedCodeSet.codes.map((code) => (
                  <tr key={code.id}>
                    <td className="py-2 pr-3">
                      <input
                        className="h-9 w-full border border-slate-200 bg-white px-3 font-mono text-sm"
                        value={code.codeId}
                        onChange={(event) =>
                          onUpdateCode(selectedCodeSet.codeSetId, code.codeId, {
                            codeId: event.target.value,
                            name: code.name,
                            active: code.active,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="h-9 w-full border border-slate-200 bg-white px-3 text-sm"
                        value={code.name}
                        onChange={(event) =>
                          onUpdateCode(selectedCodeSet.codeSetId, code.codeId, {
                            codeId: code.codeId,
                            name: event.target.value,
                            active: code.active,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        disabled={isSaving}
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() =>
                          onUpdateCode(selectedCodeSet.codeSetId, code.codeId, {
                            codeId: code.codeId,
                            name: code.name,
                            active: !code.active,
                          })
                        }
                      >
                        {code.active ? "Active" : "Inactive"}
                      </Button>
                    </td>
                    <td className="py-2 pl-3 text-right">
                      <Button
                        aria-label={`Delete ${code.name}`}
                        disabled={isSaving}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={() =>
                          onDeleteCode(selectedCodeSet.codeSetId, code.codeId)
                        }
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50/70">
                  <td className="py-3 pr-3">
                    <input
                      className="h-9 w-full border border-slate-200 bg-white px-3 font-mono text-sm"
                      placeholder="code_id"
                      value={draft.codeId}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [selectedCodeSet.codeSetId]: {
                            ...draft,
                            codeId: event.target.value,
                          },
                        }))
                      }
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      className="h-9 w-full border border-slate-200 bg-white px-3 text-sm"
                      placeholder="Display name"
                      value={draft.name}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [selectedCodeSet.codeSetId]: {
                            ...draft,
                            name: event.target.value,
                          },
                        }))
                      }
                    />
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500">Active</td>
                  <td className="py-3 pl-3 text-right">
                    <Button
                      disabled={
                        isSaving || !draft.codeId.trim() || !draft.name.trim()
                      }
                      type="button"
                      onClick={() => {
                        onCreateCode(selectedCodeSet.codeSetId, draft)
                        setDrafts((current) => ({
                          ...current,
                          [selectedCodeSet.codeSetId]: {
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
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : selectedCodeSet.codes.length === 0 ? (
          <p className="border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No codes in this set.
          </p>
        ) : (
          <div className="overflow-hidden border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Code ID</th>
                  <th className="px-4 py-3 font-medium">Display name</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedCodeSet.codes.map((code) => (
                  <tr key={code.id} className="bg-white">
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {code.codeId}
                    </td>
                    <td className="px-4 py-3 text-slate-900">{code.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={code.active ? "outline" : "secondary"}>
                        {code.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
