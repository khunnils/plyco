import { type Vocabulary } from "@plyco/shared"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
import { codeLabel } from "@/features/vocabulary/lib/vocabulary"

const boolText = (value: boolean) => (value ? "Yes" : "No")

const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[],
) =>
  values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

const detailRows = (profile: ProfileDraft) => [
  ["Stores PII", boolText(profile.dataHandling.storesPii)],
  ["Healthcare data", boolText(profile.dataHandling.storesHealthcareData)],
  ["Encryption at rest", boolText(profile.dataHandling.encryptionAtRest)],
  ["Encryption in transit", boolText(profile.dataHandling.encryptionInTransit)],
  [
    "Production data in development",
    boolText(profile.dataHandling.productionDataInDevelopment),
  ],
  ["Retention policy", boolText(profile.dataHandling.retentionPolicyExists)],
]

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
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
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
                  dataType.description.trim() ||
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
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              Sensitive
                            </span>
                          ) : null}
                          {dataType.isRequired ? (
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              Required
                            </span>
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

        <section className="grid content-start gap-3">
          <h3 className="text-sm font-semibold text-slate-950">
            General attributes
          </h3>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {detailRows(profile).map(([label, value]) => (
              <div
                className="rounded-md border border-slate-200 bg-slate-50 p-3"
                key={label}
              >
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
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
