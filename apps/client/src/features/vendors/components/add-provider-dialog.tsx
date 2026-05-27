import { useState } from "react"
import { Loader2, Globe, X, AlertTriangle } from "lucide-react"
import { type OrganizationProviderInput } from "@plyco/shared"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { resolveProviderByUrl } from "@/lib/api"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"

interface AddProviderDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (provider: OrganizationProviderInput) => void
  onTriggerManualAdd: () => void
}

export const AddProviderDialog = ({
  isOpen,
  onClose,
  onSuccess,
  onTriggerManualAdd,
}: AddProviderDialogProps) => {
  const { selectedOrganizationId } = useSelectedOrganization()
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  if (!isOpen) return null

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    // Ensure URL has a protocol
    let targetUrl = url.trim()
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`
    }

    try {
      new URL(targetUrl)
    } catch {
      toast.error("Please enter a valid website URL")
      return
    }

    setStatus("loading")
    setErrorMsg("")

    try {
      const result = await resolveProviderByUrl(
        selectedOrganizationId ?? "",
        targetUrl,
      )

      // Map lookup result to OrganizationProviderInput
      const provider = result.provider
      const organization = result.organization

      const validCriticalities = ["low", "medium", "high", "critical"]
      const lookupCriticality = (provider.securityCriticality || "").toLowerCase()
      const criticality = validCriticalities.includes(lookupCriticality)
        ? (lookupCriticality as "low" | "medium" | "high" | "critical")
        : "medium"

      const providerInput: OrganizationProviderInput = {
        providerId: "",
        systemTypes: [],
        name: provider.name || organization.name || "",
        legalName: organization.legalName || "",
        category: provider.category || "",
        countryOfRegistration: organization.countryOfRegistration || "",
        criticality,
        notes: "",
        purpose: provider.purpose || "",
      }

      toast.success("Details resolved successfully!")
      onSuccess(providerInput)
    } catch (err: unknown) {
      console.error("Failed to resolve provider:", err)
      const message = err instanceof Error ? err.message : "Could not retrieve details from the website."
      setErrorMsg(message)
      setStatus("error")
    }
  }

  const handleManualAdd = () => {
    onClose()
    onTriggerManualAdd()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={status === "loading"}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>

        {status === "idle" && (
          <form onSubmit={handleResolve} className="grid gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Add new provider</h3>
              <p className="mt-1.5 text-sm text-slate-500">
                Enter the vendor website URL to automatically import name, legal details, country, and security parameters.
              </p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="vendor-url" className="text-sm font-medium text-slate-700">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="vendor-url"
                  type="text"
                  required
                  placeholder="https://example.com"
                  className="pl-9 h-10 border border-slate-200"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">Import provider</Button>
            </div>
          </form>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="size-10 animate-spin text-slate-900" />
            <h4 className="mt-4 font-semibold text-slate-950">Analyzing vendor website...</h4>
            <p className="mt-2 text-sm text-slate-500 max-w-xs">
              We are automatically resolving company details, category, and security criticality from the website. This might take up to 10 seconds.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="grid gap-4">
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700 mb-3 border border-amber-100">
                <AlertTriangle className="size-6" />
              </div>
              <h4 className="font-semibold text-slate-950">Failed to resolve provider</h4>
              <p className="mt-2 text-sm text-slate-500 max-w-sm">
                We couldn&apos;t automatically retrieve details from <span className="font-medium text-slate-800">{url}</span>. ({errorMsg})
              </p>
              <p className="mt-3 text-sm text-slate-600 max-w-sm font-medium">
                Would you like to manually define this provider instead?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatus("idle")}
              >
                Try different URL
              </Button>
              <Button type="button" onClick={handleManualAdd}>
                Define manually
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
