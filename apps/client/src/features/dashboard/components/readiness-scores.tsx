import { type ReadinessScores } from "@plyco/shared"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

import {
  readinessAreaDetails,
  readinessAreaOrder,
  readinessCoverageText,
  readinessScoreStatus,
} from "@/features/recommendations/lib/readiness-scores"

export const OverallReadinessScore = ({
  isLoading,
  profileCompletion,
  scores,
}: {
  isLoading: boolean
  profileCompletion: number
  scores?: ReadinessScores
}) => {
  const score = scores?.overall
  const status = readinessScoreStatus(score?.value ?? null)

  return (
    <section
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center gap-3 border border-slate-200 bg-white p-8 text-center"
    >
      <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
        Readiness score
      </span>
      {isLoading ? (
        <div className="grid justify-items-center gap-3">
          <div className="h-14 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <>
          <div className={`text-5xl font-extrabold ${status.valueClass}`}>
            {score?.value ?? "—"}
            {score?.value !== null && score?.value !== undefined ? (
              <span className="ml-1 text-xl font-semibold text-slate-400">
                /100
              </span>
            ) : null}
          </div>
          <div
            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badgeClass}`}
          >
            {status.label}
          </div>
          <p className="text-xs font-medium text-slate-600">
            {score ? readinessCoverageText(score) : "Checking advisor rules"}
          </p>
        </>
      )}
      <div className="mt-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        Profile {profileCompletion}% complete
      </div>
    </section>
  )
}

export const ReadinessScoreBreakdown = ({
  isLoading,
  scores,
}: {
  isLoading: boolean
  scores?: ReadinessScores
}) => (
  <section className="grid gap-5 border border-slate-200 bg-white p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-950">
          Readiness by area
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Based on answered, applicable advisor checks. This is a readiness
          signal, not an audit or certification result.
        </p>
      </div>
      <Link
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-950 focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
        to="/recommendations"
      >
        View recommendations
        <ArrowUpRight className="size-4" />
      </Link>
    </div>

    <div className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
      {readinessAreaOrder.map((area) => {
        const details = readinessAreaDetails[area]
        const score = scores?.byArea[area]
        const value = score?.value ?? null
        const status = readinessScoreStatus(value)

        return (
          <Link
            aria-label={
              isLoading
                ? `Checking ${details.label} readiness`
                : `${details.label} readiness${value === null ? ", not enough data" : `, ${value} out of 100`}`
            }
            className={`group grid cursor-pointer gap-2 rounded-sm focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none ${area === "productAndData" ? "lg:col-span-2" : ""}`}
            key={area}
            to={details.href}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 transition-colors duration-200 group-hover:text-slate-600">
                  {details.label}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isLoading || !score
                    ? "Checking advisor rules"
                    : readinessCoverageText(score)}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${status.valueClass}`}>
                  {isLoading ? "..." : (value ?? "—")}
                </div>
                <div className="text-xs text-slate-500">
                  {isLoading ? "Checking" : status.label}
                </div>
              </div>
            </div>
            <div
              aria-label={`${details.label} readiness score`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={value ?? undefined}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none ${status.barClass}`}
                style={{ width: `${value ?? 0}%` }}
              />
            </div>
          </Link>
        )
      })}
    </div>
  </section>
)
