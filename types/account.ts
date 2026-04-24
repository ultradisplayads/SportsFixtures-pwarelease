// types/account.ts
// Canonical account/profile domain types for Section 06.
// All account, profile, and user-control surfaces consume these types.

export type AccountMode = "anonymous_device" | "signed_in"

export type ConsentKey =
  | "marketing_email"
  | "marketing_push"
  | "personalization"
  | "location_recommendations"
  | "analytics"
  | "affiliate_tracking"

export type SessionSecurityState = {
  canChangePassword: boolean
  canDeleteAccount: boolean
  hasPasswordLogin: boolean
  hasSocialLogin: boolean
  lastUpdatedAt?: string | null
}

export type UserProfileSummary = {
  id: string
  mode: AccountMode
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  avatarUrl?: string | null
  city?: string | null
  country?: string | null
  timezone?: string | null
  createdAt?: string | null
  premiumTier?: string | null
  premiumActive?: boolean
}

export type UserProfilePreferencesSummary = {
  followedTeamsCount: number
  followedCompetitionsCount: number
  followedPlayersCount: number
  followedVenuesCount: number
  notificationsEnabled: boolean
  pushEnabled: boolean
  calendarMode?: "my-calendar" | "all-fixtures" | null
  locationRecommendationsEnabled: boolean
}

export type UserConsentState = {
  values: Record<ConsentKey, boolean>
  updatedAt?: string | null
}

export type AccountDeletionState = {
  enabled: boolean
  requiresConfirmation: boolean
  warningCopy: string
}

export type AccountOverviewResponse = {
  profile: UserProfileSummary
  security: SessionSecurityState
  preferences: UserProfilePreferencesSummary
  consent: UserConsentState
  deletion: AccountDeletionState
}

// Editable profile fields — only fields that can actually be persisted
export type ProfileEditPayload = {
  displayName?: string
  firstName?: string
  lastName?: string
  phone?: string
  city?: string
  country?: string
  timezone?: string
}

export type PasswordChangePayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type ConsentUpdatePayload = {
  values: Record<ConsentKey, boolean>
}
