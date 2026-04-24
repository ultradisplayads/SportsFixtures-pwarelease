"use client"

// components/account/profile-edit-form.tsx
// Real profile edit form — saves via useAccountActions().updateProfile().
// Only shown when canEditIdentity() is true (signed-in users).
// No fake success: success message only appears after the server confirms.

import { useState } from "react"
import { Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useAccountActions } from "@/hooks/use-account-actions"
import type { UserProfileSummary } from "@/types/account"

interface ProfileEditFormProps {
  profile: UserProfileSummary
  onSaved?: (updated: UserProfileSummary) => void
}

const TIMEZONES = [
  "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Asia/Bangkok", "Asia/Singapore", "Asia/Tokyo", "Asia/Dubai",
  "Australia/Sydney", "Pacific/Auckland",
]

export function ProfileEditForm({ profile, onSaved }: ProfileEditFormProps) {
  const { updateProfile } = useAccountActions()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    displayName: profile.displayName || "",
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    phone: profile.phone || "",
    city: profile.city || "",
    country: profile.country || "",
    timezone: profile.timezone || "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function set(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    const result = await updateProfile(form)
    setSaving(false)
    if (!result.success) {
      setError(result.error)
    } else {
      setSuccess("Profile updated successfully.")
      onSaved?.(result.data)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <span className="text-sm font-semibold">Edit profile</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <input
                value={form.firstName}
                onChange={e => set("firstName", e.target.value)}
                placeholder="First name"
                className="input-base"
              />
            </Field>
            <Field label="Last name">
              <input
                value={form.lastName}
                onChange={e => set("lastName", e.target.value)}
                placeholder="Last name"
                className="input-base"
              />
            </Field>
          </div>

          <Field label="Display name">
            <input
              value={form.displayName}
              onChange={e => set("displayName", e.target.value)}
              placeholder="How you appear in the app"
              className="input-base"
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
              placeholder="+44 7700 000000"
              className="input-base"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={form.city}
                onChange={e => set("city", e.target.value)}
                placeholder="Bangkok"
                className="input-base"
              />
            </Field>
            <Field label="Country">
              <input
                value={form.country}
                onChange={e => set("country", e.target.value)}
                placeholder="Thailand"
                className="input-base"
              />
            </Field>
          </div>

          <Field label="Timezone">
            <select
              value={form.timezone}
              onChange={e => set("timezone", e.target.value)}
              className="input-base"
            >
              <option value="">Select timezone</option>
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </Field>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          color: hsl(var(--foreground));
        }
        .input-base:focus {
          border-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
