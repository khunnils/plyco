import { useNavigate } from "react-router-dom"
import { Trash2, ShieldAlert, Plus, Shield, Code, Cloud, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"

const getCategoryIcon = (systemTypes: string[] = []) => {
  if (systemTypes.includes("auth")) {
    return <Shield className="size-4 text-slate-500" />
  }
  if (systemTypes.includes("source_control")) {
    return <Code className="size-4 text-slate-500" />
  }
  if (systemTypes.includes("cloud")) {
    return <Cloud className="size-4 text-slate-500" />
  }
  if (systemTypes.includes("analytics")) {
    return <BarChart3 className="size-4 text-slate-500" />
  }
  return null
}

const getCategoryName = (systemTypes: string[] = []) => {
  if (systemTypes.includes("auth")) {
    return "Workforce Identity"
  }
  if (systemTypes.includes("source_control")) {
    return "Code Repository"
  }
  if (systemTypes.includes("cloud")) {
    return "Cloud Platform"
  }
  if (systemTypes.includes("analytics")) {
    return "Analytics"
  }
  return "Technology Provider"
}

export const ReviewProvidersTab = () => {
  const navigate = useNavigate()
  const { draft, updateDraft } = useOnboardingStore()

  if (!draft) {
    return null
  }

  const deleteProvider = (providerId: string | undefined, name: string) => {
    updateDraft((current) => ({
      ...current,
      providers: current.providers.filter(
        (p) => !(p.providerId === providerId && p.name === name)
      ),
    }))
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">Technology Providers</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Review and manage core systems and platforms to be saved in your vendor inventory.
          </p>
        </div>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={() => navigate("../providers")}
        >
          <Plus className="size-4 mr-1" />
          Edit Providers
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {draft.providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <ShieldAlert className="size-8 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-950">No technology providers selected</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              You haven't selected any workforce identity, code repository, cloud, or analytics providers.
            </p>
            <Button
              className="mt-4"
              size="sm"
              variant="outline"
              onClick={() => navigate("../providers")}
            >
              Select Providers
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
            {draft.providers.map((provider, index) => (
              <li
                key={`${provider.providerId}-${provider.name}-${index}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-50 border border-slate-200/60 shadow-2xs">
                    {getCategoryIcon(provider.systemTypes)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-950 truncate">
                      {provider.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {getCategoryName(provider.systemTypes)}
                    </p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteProvider(provider.providerId, provider.name)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Remove {provider.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
