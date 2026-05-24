import { type Provider, type Vocabulary } from "@plyco/shared"

import { ComplianceDisclosuresPanel } from "@/features/company/privacy/components/compliance-disclosures-panel"
import { CookiePreferencesPanel } from "@/features/company/privacy/components/cookie-preferences-panel"
import { InternationalTransfersPanel } from "@/features/company/privacy/components/international-transfers-panel"
import { MarketingCommunicationsPanel } from "@/features/company/privacy/components/marketing-communications-panel"
import { PrivacyRepresentationPanel } from "@/features/company/privacy/components/privacy-representation-panel"
import { PrivacyRightsPanel } from "@/features/company/privacy/components/privacy-rights-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const PrivacyManager = ({
  cookieConsentMechanismOptions,
  isMutationPending,
  marketingOptOutMethodOptions,
  newsletterProviderOptions,
  profile,
  providers,
  requestMethodOptions,
  supportedRightOptions,
  transferMechanismOptions,
  vocabulary,
  onSaveProfile,
}: {
  cookieConsentMechanismOptions: Option[]
  isMutationPending: boolean
  marketingOptOutMethodOptions: Option[]
  newsletterProviderOptions: Option[]
  profile: ProfileDraft
  providers: Provider[]
  requestMethodOptions: Option[]
  supportedRightOptions: Option[]
  transferMechanismOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => {
  const savePrivacy = (
    patch: Partial<ProfileDraft["privacy"]>,
    onSuccess?: () => void
  ) => {
    onSaveProfile(
      {
        ...profile,
        privacy: {
          ...profile.privacy,
          ...patch,
        },
      },
      onSuccess
    )
  }

  return (
    <div className="grid gap-10">
      <PrivacyRightsPanel
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        requestMethodOptions={requestMethodOptions}
        supportedRightOptions={supportedRightOptions}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <CookiePreferencesPanel
        cookieConsentMechanismOptions={cookieConsentMechanismOptions}
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <MarketingCommunicationsPanel
        catalogProviders={providers}
        isMutationPending={isMutationPending}
        marketingOptOutMethodOptions={marketingOptOutMethodOptions}
        newsletterProviderOptions={newsletterProviderOptions}
        privacy={profile.privacy}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <InternationalTransfersPanel
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        transferMechanismOptions={transferMechanismOptions}
        vocabulary={vocabulary}
        onSave={savePrivacy}
      />
      <ComplianceDisclosuresPanel
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        onSave={savePrivacy}
      />
      <PrivacyRepresentationPanel
        isMutationPending={isMutationPending}
        privacy={profile.privacy}
        onSave={savePrivacy}
      />
    </div>
  )
}
