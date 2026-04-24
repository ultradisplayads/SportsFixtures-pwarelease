"use client"

// components/account/password-change-form.tsx
// Only rendered when canChangePassword(security) is true.
// Never pretends to succeed — success only after server confirmation.

import { useState } from "react"
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useAccountActions } from "@/hooks/use-account-actions"

export function PasswordChangeForm() {
  const { changePassword } = useAccountActions()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [show, setShow] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function set(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.")
      return
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }

    setSaving(true)
    const result = await changePassword(form)
    setSaving(false)

    if (!result.success) {
      setError(result.error)
    } else {
      setSuccess("Password changed successfully.")
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(() => setOpen(false), 2000)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <span className="text-sm font-semibold">Change password</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {(["currentPassword", "newPassword", "confirmPassword"] as const).map(field => (
            <div key={field} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {field === "currentPassword"
                  ? "Current password"
                  : field === "newPassword"
                  ? "New password"
                  : "Confirm new password"}
              </label>
              <div className="relative">
                <input
                  type={show[field] ? "text" : "password"}
                  value={form[field]}
                  onChange={e => set(field, e.target.value)}
                  autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-4 pr-10 text-sm outline-none focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={show[field] ? "Hide" : "Show"}
                >
                  {show[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}

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
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Updating..." : "Change password"}
          </button>
        </form>
      )}
    </div>
  )
}
