import { Pencil, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { type Vocabulary } from "@plyco/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CodeSetEditorDialog } from "@/features/vocabulary/components/code-set-editor-dialog"
import { cn } from "@/lib/utils"

export const VocabularyManager = ({
  vocabulary,
}: {
  vocabulary: Vocabulary | undefined
}) => {
  const [filter, setFilter] = useState("")
  const [selectedCodeSetId, setSelectedCodeSetId] = useState<string | null>(
    null
  )
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const codeSets = useMemo(
    () => vocabulary?.codeSets.filter((codeSet) => !codeSet.isSystem) ?? [],
    [vocabulary]
  )
  const filteredCodeSets = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return codeSets
    return codeSets.filter((codeSet) =>
      [
        codeSet.name,
        codeSet.codeSetId,
        codeSet.description,
        ...codeSet.codes.flatMap((code) => [
          code.codeId,
          code.name,
          code.description,
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
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
              autoComplete="new-password"
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
            filteredCodeSets.map((codeSet) => (
              <button
                className={cn(
                  "flex w-full items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition",
                  codeSet.codeSetId === selectedCodeSet.codeSetId
                    ? "bg-slate-100 text-slate-950"
                    : "bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                )}
                key={codeSet.id}
                type="button"
                onClick={() => setSelectedCodeSetId(codeSet.codeSetId)}
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
                  {codeSet.codes.filter((code) => code.active).length}/
                  {codeSet.codes.length}
                </span>
              </button>
            ))
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
            onClick={() => setIsEditorOpen(true)}
          >
            <Pencil /> Edit
          </Button>
        </div>

        <div className="overflow-hidden border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Code ID</th>
                <th className="px-4 py-3 font-medium">Display name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {selectedCodeSet.codes.map((code) => (
                <tr key={code.id}>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {code.codeId}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{code.name}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {code.description || "-"}
                  </td>
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
      </section>

      <CodeSetEditorDialog
        codeSetId={selectedCodeSet.codeSetId}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  )
}
