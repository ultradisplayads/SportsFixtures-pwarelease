// components/account/consent-panel.tsx
// Section 06 — Canonical import path for the privacy consent form.
// Re-exports PrivacyConsentForm as ConsentPanel so pages can import from
// @/components/account/consent-panel without knowing the legacy file name.

export { PrivacyConsentForm as ConsentPanel } from "@/components/account/privacy-consent-form"
