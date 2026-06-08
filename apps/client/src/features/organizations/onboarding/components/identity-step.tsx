import { type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Sparkles, Info, LogOut } from "lucide-react"
import { organizationLookupInputSchema } from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"
import { TextInput } from "../../components/text-input"
import { CreateShell } from "../../components/create-shell"
import { fallbackDraft, normalizeUrl } from "../../components/types"

export const IdentityStep = () => {
  const navigate = useNavigate()
  const {
    name,
    setName,
    website,
    setWebsite,
    setDraft,
    submitError,
    setSubmitError,
    onCancel,
    onLogout,
  } = useOnboardingStore()

  const actions = onCancel ? (
    <Button type="button" variant="outline" onClick={onCancel}>
      Close
    </Button>
  ) : onLogout ? (
    <Button type="button" variant="outline" onClick={onLogout}>
      <LogOut />
      Logout
    </Button>
  ) : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedWebsite = normalizeUrl(website)
    const parsed = organizationLookupInputSchema.safeParse({
      name,
      website: normalizedWebsite,
    })

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Check the form.")
      return
    }

    setSubmitError(null)
    setName(parsed.data.name)
    setWebsite(normalizedWebsite)
    setDraft(fallbackDraft(parsed.data))
    navigate("../markets")
  }

  return (
    <CreateShell
      actions={actions}
      step="identity"
      title="Let's build your workspace"
    >
      <form
        className="mx-auto grid max-w-2xl gap-6"
        onSubmit={handleSubmit}
      >
        <TextInput
          label="Organization name"
          placeholder="Acme AI"
          required
          value={name}
          onChange={setName}
        />
        <TextInput
          label="Website"
          helperText="We use this to prefill setup from public pages and policy links."
          placeholder="www.example.com"
          required
          type="text"
          value={website}
          onChange={setWebsite}
        />
        <div className="flex gap-4 rounded-lg border border-primary-100 bg-primary-50 p-4 text-left">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-700">
            <Info className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-900">
              Workspace identity
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Add the basics first. We will ask for regions and goals before
              reading public pages for editable defaults.
            </p>
          </div>
        </div>
        {submitError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        ) : null}
        <div className="grid gap-4 pt-2">
          <Button
            className="h-12"
            type="submit"
          >
            <Sparkles />
            Continue
          </Button>

        </div>
      </form>
    </CreateShell>
  )
}
