import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { type AuthUser } from "@plyco/shared"

import { useOnboardingStore } from "../stores/onboarding-store"
import { IdentityStep } from "../components/identity-step"
import { MarketsStep } from "../components/markets-step"
import { ComplianceStep } from "../components/compliance-step"
import { LookupStep } from "../components/lookup-step"
import { ReviewStep } from "../components/review-step"

export const OnboardingWizardPage = ({
  user,
  onCancel,
  onComplete,
  onLogout,
}: {
  user: AuthUser
  onCancel?: () => void
  onComplete?: () => void
  onLogout?: () => void
}) => {
  // Sync props to store immediately during render phase
  useOnboardingStore.setState({ user, onCancel, onComplete, onLogout })

  // Reset store on unmount to prevent stale state
  useEffect(() => {
    return () => {
      useOnboardingStore.getState().reset()
    }
  }, [])

  return (
    <Routes>
      <Route path="identity" element={<IdentityStep />} />
      <Route path="markets" element={<MarketsStep />} />
      <Route path="compliance" element={<ComplianceStep />} />
      <Route path="lookup" element={<LookupStep />} />
      <Route path="review" element={<ReviewStep />} />
      <Route path="*" element={<Navigate to="identity" replace />} />
    </Routes>
  )
}

export default OnboardingWizardPage
