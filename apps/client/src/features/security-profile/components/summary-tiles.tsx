import { type OrganizationProvider } from "@plyco/shared"

import { type ProfileDraft } from "@/features/security-profile/types/security-profile"

export const SummaryTiles = ({
  profile,
  providers,
}: {
  profile: ProfileDraft
  providers: OrganizationProvider[]
}) => {
  const completeBasics = [
    profile.infrastructure.mfaEnabled,
    profile.infrastructure.encryptedDevicesRequired,
    profile.dataHandling.encryptionAtRest,
    profile.dataHandling.encryptionInTransit,
    profile.access.offboardingProcessExists,
    profile.access.privilegedAccessRestricted,
  ].filter(Boolean).length

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Security basics</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          {completeBasics}/6
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Providers tracked</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          {providers.length}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Data handling</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          {profile.dataHandling.dataTypesStored.length}
        </p>
      </div>
    </div>
  )
}
