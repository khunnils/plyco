import { type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
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
  } = useOnboardingStore()

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
      description="Add the basics first. We will ask for regions and goals before reading public pages for editable defaults."
      step="identity"
      titleAbove
      title="Let's build your workspace"
    >
      <form className="mx-auto grid max-w-2xl gap-6" onSubmit={handleSubmit}>
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
        {submitError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        ) : null}
        <div className="grid gap-4 pt-2">
          <Button className="h-12" type="submit">
            Continue
          </Button>
        </div>
      </form>
    </CreateShell>
  )
}
