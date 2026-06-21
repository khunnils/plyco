import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  ClipboardList,
  FileSearch,
  Loader2,
  Check,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"
import { CreateShell } from "../../components/create-shell"
import {
  useLookupOrganizationWebsite,
  useLookupPrivacyPolicy,
} from "@/features/organizations/hooks/use-organizations"
import { mergeLookupDraft } from "../../components/types"

const privacyLookupWarning =
  "Privacy policy details could not be enriched. You can continue manually."

const websiteLookupWarning =
  "Website details could not be enriched. You can continue manually."

const organizationDetailsDurationMs = 4000

type LookupPanelStatus = "pending" | "active" | "complete" | "skipped"

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs)
  })

const lookupPanelTone = (status: LookupPanelStatus) => {
  if (status === "complete") {
    return {
      panel: "border-slate-300 bg-white shadow-sm ring-1 ring-slate-100",
      icon: "bg-slate-900 text-white",
      bar: "bg-slate-900",
      status: "text-slate-700",
    }
  }

  if (status === "active") {
    return {
      panel: "border-slate-300 bg-white shadow-sm ring-2 ring-slate-200",
      icon: "bg-slate-100 text-slate-900",
      bar: "bg-slate-800",
      status: "text-slate-900",
    }
  }

  if (status === "skipped") {
    return {
      panel: "border-slate-200 bg-slate-50",
      icon: "bg-slate-200 text-slate-500",
      bar: "bg-slate-300",
      status: "text-slate-500",
    }
  }

  return {
    panel: "border-slate-200 bg-white",
    icon: "bg-slate-100 text-slate-400",
    bar: "bg-slate-200",
    status: "text-slate-400",
  }
}

const LookupStatusPanel = ({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode
  label: string
  status: LookupPanelStatus
}) => {
  const tone = lookupPanelTone(status)
  const statusLabel =
    status === "complete"
      ? "Complete"
      : status === "skipped"
        ? "Skipped"
        : status === "active"
          ? "In progress"
          : "Waiting"

  return (
    <div
      className={`grid min-h-24 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border px-4 py-3 text-left transition ${tone.panel}`}
    >
      <div
        className={`flex size-12 items-center justify-center rounded-md ${tone.icon}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-wide text-slate-950">
          {label}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
            style={{
              width:
                status === "complete"
                  ? "100%"
                  : status === "active"
                    ? "72%"
                    : status === "skipped"
                      ? "100%"
                      : "0%",
            }}
          />
        </div>
      </div>
      <div
        className={`flex size-7 items-center justify-center rounded-full ${tone.status}`}
      >
        {status === "complete" ? (
          <Check className="size-4" />
        ) : status === "active" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : status === "skipped" ? (
          <span className="h-px w-3 rounded-full bg-current" />
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
      </div>
      <span className="sr-only">{statusLabel}</span>
    </div>
  )
}

const LookupIllustration = () => (
  <div className="relative mx-auto size-44">
    <div className="absolute inset-4 rounded-full border border-slate-300" />
    <div className="absolute inset-8 rounded-full border border-slate-300" />
    <div className="absolute inset-12 rounded-full border border-slate-300" />
    <div className="onboarding-lookup-core absolute inset-17 rounded-full border border-slate-200 bg-slate-50" />
    <span className="onboarding-lookup-dot onboarding-lookup-dot-primary absolute top-2 right-6 size-3 rounded-full bg-slate-900 shadow-sm" />
    <span className="onboarding-lookup-dot onboarding-lookup-dot-secondary absolute bottom-9 left-4 size-2.5 rounded-full bg-slate-400 shadow-sm" />
    <span className="onboarding-lookup-dot onboarding-lookup-dot-tertiary absolute right-12 bottom-1 size-2 rounded-full bg-slate-500 shadow-sm" />
    <div className="absolute inset-0 flex items-center justify-center text-slate-900">
      <div className="relative size-12">
        <span className="absolute top-1/2 left-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-0 bg-slate-900" />
        <span className="absolute top-1/2 left-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-60 bg-slate-900" />
        <span className="absolute top-1/2 left-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-120 bg-slate-900" />
        <span className="absolute top-1/2 left-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-180 bg-slate-900" />
        <span className="absolute top-1/2 left-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-240 bg-slate-900" />
        <span className="absolute top-1/2 left-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-300 bg-slate-900" />
        <span className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute top-1/2 left-0 size-3 -translate-y-1/2 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute top-1/2 right-0 size-3 -translate-y-1/2 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute top-1 left-[0.55rem] size-3 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute top-1 right-[0.55rem] size-3 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute bottom-1 left-[0.55rem] size-3 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute right-[0.55rem] bottom-1 size-3 rounded-full border-4 border-slate-900 bg-white" />
      </div>
    </div>
  </div>
)

const LookupLoadingView = ({
  organizationDetailsStatus,
  organizationLookupStatus,
  privacyLookupStatus,
}: {
  organizationDetailsStatus: LookupPanelStatus
  organizationLookupStatus: LookupPanelStatus
  privacyLookupStatus: LookupPanelStatus
}) => (
  <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
    <LookupIllustration />
    <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
      Building an understanding
    </h1>
    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
      We are analyzing your website and existing policies to streamline
      workspace setup.
    </p>
    <div className="mt-10 grid w-full gap-3">
      <LookupStatusPanel
        icon={<Building2 className="size-5" />}
        label="Resolving organization details"
        status={organizationDetailsStatus}
      />
      <LookupStatusPanel
        icon={<ClipboardList className="size-5" />}
        label="Building initial activities"
        status={organizationLookupStatus}
      />
      <LookupStatusPanel
        icon={<FileSearch className="size-5" />}
        label="Analyzing existing policies"
        status={privacyLookupStatus}
      />
    </div>
    <div className="mt-8 flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-700 uppercase">
      <span className="size-2 rounded-full bg-slate-900" />
      <span className="size-2 rounded-full bg-slate-700" />
      <span className="size-2 rounded-full bg-slate-500" />
      Active discovery in progress
    </div>
  </div>
)

export const LookupStep = () => {
  const navigate = useNavigate()
  const { draft, setDraft, setSubmitError, onCancel } = useOnboardingStore()

  const [organizationDetailsComplete, setOrganizationDetailsComplete] =
    useState(false)
  const [organizationLookupComplete, setOrganizationLookupComplete] =
    useState(false)
  const [privacyLookupStatus, setPrivacyLookupStatus] =
    useState<LookupPanelStatus>("pending")

  const lookupOrganizationWebsite = useLookupOrganizationWebsite()
  const lookupPrivacyPolicy = useLookupPrivacyPolicy()

  useEffect(() => {
    if (!draft) {
      navigate("../identity", { replace: true })
      return
    }

    let isMounted = true

    const runLookups = async () => {
      const lookupInput = {
        name: draft.company.companyName,
        website: draft.company.website ?? "",
      }
      let nextDraft = draft

      setSubmitError(null)
      if (isMounted) {
        setOrganizationDetailsComplete(false)
        setOrganizationLookupComplete(false)
        setPrivacyLookupStatus("pending")
      }

      const organizationDetailsPromise = wait(
        organizationDetailsDurationMs
      ).then(() => {
        if (isMounted) {
          setOrganizationDetailsComplete(true)
        }
      })

      try {
        const result = await lookupOrganizationWebsite.mutateAsync({
          website: lookupInput.website,
        })
        nextDraft = mergeLookupDraft(nextDraft, lookupInput, result)
        if (isMounted) {
          setDraft(nextDraft)
          setOrganizationLookupComplete(true)
        }

        if (result.privacyPolicyUrl) {
          if (isMounted) {
            setPrivacyLookupStatus("active")
          }

          try {
            const privacy = await lookupPrivacyPolicy.mutateAsync({
              privacyPolicyUrl: result.privacyPolicyUrl,
            })
            nextDraft = { ...nextDraft, privacy }
            if (isMounted) {
              setDraft(nextDraft)
              setPrivacyLookupStatus("complete")
            }
          } catch {
            nextDraft = {
              ...nextDraft,
              warnings: [...nextDraft.warnings, privacyLookupWarning],
            }
            if (isMounted) {
              setDraft(nextDraft)
              setPrivacyLookupStatus("complete")
            }
          }
        } else {
          if (isMounted) {
            setPrivacyLookupStatus("skipped")
          }
        }
      } catch {
        nextDraft = {
          ...nextDraft,
          warnings: [...nextDraft.warnings, websiteLookupWarning],
        }
        if (isMounted) {
          setDraft(nextDraft)
          setOrganizationLookupComplete(true)
          setPrivacyLookupStatus("skipped")
        }
      } finally {
        await organizationDetailsPromise
        if (isMounted) {
          navigate("../providers", { replace: true })
        }
      }
    }

    runLookups()

    return () => {
      isMounted = false
    }
  }, []) // Empty dependency array means runs on mount

  const stepName =
    privacyLookupStatus === "active" ? "lookup-privacy" : "lookup-organization"

  return (
    <CreateShell
      actions={
        onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        ) : null
      }
      step={stepName}
      title=""
    >
      <LookupLoadingView
        organizationDetailsStatus={
          organizationDetailsComplete ? "complete" : "active"
        }
        organizationLookupStatus={
          organizationLookupComplete ? "complete" : "active"
        }
        privacyLookupStatus={privacyLookupStatus}
      />
    </CreateShell>
  )
}
