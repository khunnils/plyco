import { type Vocabulary } from "@plyco/shared"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { SensitiveTooltip } from "@/components/ui/info-tooltip"
import { type ProfileDraft } from "@/features/company/types/company"
import { codeLabel } from "@/features/vocabulary/lib/vocabulary"

const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[] | null,
) =>
  values && values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

export const DataHandlingReadOnlySection = ({
  profile,
  vocabulary,
  onEdit,
}: {
  profile: ProfileDraft
  vocabulary: Vocabulary | undefined
  onEdit: () => void
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <div className="grid gap-4 max-w-3xl">
      <div className="grid gap-4">
        <section className="grid content-start gap-3">
          <h3 className="text-sm font-semibold text-slate-950">Data types</h3>
          {profile.dataHandling.dataTypesStored.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Not set
            </div>
          ) : (
            <div className="grid gap-3">
              {profile.dataHandling.dataTypesStored.map((dataType, index) => {
                const displayTitle =
                  dataType.name.trim() ||
                  dataType.description?.trim() ||
                  `Data type ${index + 1}`
                const expanded = expandedIndex === index

                return (
                  <article
                    className={[
                      "rounded-md border bg-white",
                      expanded
                        ? "border-blue-300 ring-2 ring-blue-100"
                        : "border-slate-200",
                    ].join(" ")}
                    key={`${dataType.name}-${index}`}
                  >
                    <button
                      aria-expanded={expanded}
                      className="flex w-full items-start gap-3 p-4 text-left"
                      type="button"
                      onClick={() =>
                        setExpandedIndex((current) =>
                          current === index ? null : index,
                        )
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-950">
                            {displayTitle}
                          </h4>
                          {dataType.isSensitive ? (
                            <SensitiveTooltip />
                          ) : null}
                          {dataType.isRequired ? (
                            <span className="text-muted-foreground text-xs">Required</span>
                          ) : null}
                        </div>
                        {dataType.description ? (
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                            {dataType.description}
                          </p>
                        ) : null}
                      </div>
                      {expanded ? (
                        <ChevronUp className="mt-0.5 size-4 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronDown className="mt-0.5 size-4 shrink-0 text-slate-500" />
                      )}
                    </button>

                    {expanded ? (
                      <dl className="grid gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-medium text-slate-500">
                            Subject type
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-900">
                            {codeValueList(
                              vocabulary,
                              "subject_types",
                              dataType.subjectTypes,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium text-slate-500">
                            Collection method
                          </dt>
                          <dd className="mt-1 text-sm font-medium text-slate-900">
                            {codeValueList(
                              vocabulary,
                              "collection_methods",
                              dataType.collectionMethods,
                            )}
                          </dd>
                        </div>
                      </dl>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
      <Button
        className="w-fit"
        type="button"
        variant="outline"
        onClick={onEdit}
      >
        Edit
      </Button>
    </div>
  )
}
