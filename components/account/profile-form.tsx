// components/account/profile-form.tsx
// Section 06 — Canonical import path for the profile edit form.
// Re-exports ProfileEditForm under the brief-specified name so pages
// can import from @/components/account/profile-form without knowing
// the legacy component file name.

export { ProfileEditForm as ProfileForm } from "@/components/account/profile-edit-form"
