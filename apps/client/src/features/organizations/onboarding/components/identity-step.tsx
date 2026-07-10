import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Loader2 } from "lucide-react"
import {
  organizationLookupInputSchema,
  organizationWebsiteLookupInputSchema,
} from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useOnboardingStore } from "../stores/onboarding-store"
import { CreateShell } from "../../components/create-shell"
import { fallbackDraft, normalizeUrl } from "../../components/types"
import {
  useValidateOrganizationWebsiteReachability,
} from "@/features/organizations/hooks/use-organizations"

type IdentityMode = "website" | "scratch"

const hostnameName = (website: string) => {
  try {
    return new URL(website).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export const IdentityStep = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<IdentityMode>("website")
  const {
    name,
    setName,
    website,
    setWebsite,
    setDraft,
    submitError,
    setSubmitError,
  } = useOnboardingStore()
  const validateWebsite = useValidateOrganizationWebsiteReachability()

  const handleWebsiteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedWebsite = normalizeUrl(website)
    const parsed = organizationWebsiteLookupInputSchema.safeParse({
      website: normalizedWebsite,
    })

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Check the form.")
      return
    }

    setSubmitError(null)

    try {
      await validateWebsite.mutateAsync({ website: parsed.data.website })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Website could not be reached."
      )
      return
    }

    const fallbackName = hostnameName(parsed.data.website)
    setSubmitError(null)
    setName(fallbackName)
    setWebsite(parsed.data.website)
    setDraft(
      fallbackDraft({
        name: fallbackName,
        website: parsed.data.website,
      })
    )
    navigate("../markets")
  }

  const handleScratchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = organizationLookupInputSchema.safeParse({
      name,
      website: "https://example.com",
    })

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Check the form.")
      return
    }

    setSubmitError(null)
    setName(parsed.data.name)
    setWebsite("")
    setDraft(fallbackDraft({ name: parsed.data.name, website: "" }))
    navigate("../markets")
  }

  const showScratch = () => {
    setSubmitError(null)
    setMode("scratch")
  }

  const showWebsite = () => {
    setSubmitError(null)
    setMode("website")
  }

  return (
    <CreateShell
      step="identity"
      title=""
      unframed
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          Step 1 of 5
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
          {mode === "website" ? "Enter your website" : "Name your organization"}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          {mode === "website"
            ? "We'll use information from your website to speed things up."
            : "We will start with a blank workspace and keep the same setup flow."}
        </p>

        <form
          className="mt-12 grid w-full max-w-3xl gap-5"
          onSubmit={
            mode === "website" ? handleWebsiteSubmit : handleScratchSubmit
          }
        >
          <label className="sr-only" htmlFor="onboarding-primary-input">
            {mode === "website" ? "Website URL" : "Organization name"}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="onboarding-primary-input"
              autoComplete={mode === "website" ? "url" : "organization"}
              autoFocus
              className="h-16 rounded-md border-slate-300 bg-white px-5 text-xl shadow-sm focus-visible:border-slate-900 focus-visible:ring-slate-200 sm:h-18 sm:text-2xl"
              placeholder={mode === "website" ? "www.example.com" : "Acme AI"}
              required
              inputMode={mode === "website" ? "url" : "text"}
              style={{ fontSize: "24px" }}
              type="text"
              value={mode === "website" ? website : name}
              onChange={(event) =>
                mode === "website"
                  ? setWebsite(event.target.value)
                  : setName(event.target.value)
              }
            />
            <Button
              className="h-16 px-6 text-base sm:h-18 sm:px-8"
              disabled={validateWebsite.isPending}
              type="submit"
            >
              {validateWebsite.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ArrowRight />
              )}
              Continue
            </Button>
          </div>

        {submitError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-left text-sm text-red-800">
            {submitError}
          </p>
        ) : null}

          {mode === "website" ? (
            <button
              className="mx-auto text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
              type="button"
              onClick={showScratch}
            >
              No website yet? Start from scratch.
            </button>
          ) : (
            <button
              className="mx-auto text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline"
              type="button"
              onClick={showWebsite}
            >
              Use a website instead.
            </button>
          )}
        </form>
      </div>
    </CreateShell>
  )
}
