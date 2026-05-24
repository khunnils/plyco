import { type Provider, type Vocabulary } from "@plyco/shared"

import { PrivacyManager } from "@/features/company/privacy/components/privacy-manager"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"

export const PrivacyProfilePage = ({
  isMutationPending,
  profile,
  providers,
  vocabulary,
  onSaveProfile,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  providers: Provider[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => (
  <PrivacyManager
    cookieConsentMechanismOptions={codeOptions(
      vocabulary,
      "privacy_cookie_consent_mechanisms"
    )}
    dpoStatusOptions={codeOptions(vocabulary, "privacy_dpo_statuses")}
    euRepresentativeStatusOptions={codeOptions(
      vocabulary,
      "privacy_eu_representative_statuses"
    )}
    isMutationPending={isMutationPending}
    marketingOptOutMethodOptions={codeOptions(
      vocabulary,
      "privacy_marketing_opt_out_methods"
    )}
    newsletterProviderOptions={providers
      .filter((provider) => provider.systemTypes.includes("newsletter"))
      .map((provider) => ({
        value: provider.id,
        label: provider.name,
      }))}
    profile={profile}
    providers={providers}
    requestMethodOptions={codeOptions(vocabulary, "privacy_request_methods")}
    supportedRightOptions={codeOptions(vocabulary, "privacy_supported_rights")}
    transferMechanismOptions={codeOptions(
      vocabulary,
      "privacy_transfer_mechanisms"
    )}
    vocabulary={vocabulary}
    onSaveProfile={onSaveProfile}
  />
)
