"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, ChevronLeft, Mail, Lock, ArrowRight, Loader2, User } from "lucide-react"
import Link from "next/link"
import { useAuth, getRoleRedirect } from "@/lib/auth-context"
import { LogoSquare } from "@/components/logo-badge"

type Mode = "choose" | "email" | "otp-email" | "otp-code" | "register"

export default function SignInPage() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>("choose")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [otp, setOtp] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpSent, setOtpSent] = useState(false)

  // ✅ ALL hooks before any early returns

  // Auth guard — redirect away if already logged in
  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated && auth.user) {
      window.location.href = getRoleRedirect(auth.user.role?.type)
    }
  }, [auth.loading, auth.isAuthenticated, auth.user])

  // Show error messages from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reason = params.get("reason")
    const err = params.get("error")
    if (reason === "session_expired") setError("Your session has expired. Please sign in again.")
    if (reason === "idle_timeout") setError("You were signed out due to inactivity.")
    if (err === "google_auth_failed") setError("Google sign-in failed. Please try again.")
    if (err === "facebook_auth_failed") setError("Facebook sign-in failed. Please try again.")
    if (err === "auth_failed") setError("Sign-in failed. Please try again.")
  }, [])

  // ✅ Early returns AFTER all hooks
  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleError = (msg: string) => { setError(msg); setLoading(false) }

  async function handleEmailSignIn() {
    if (!email || !password) return handleError("Email and password required")
    setLoading(true); setError("")
    const ok = await auth.signInWithEmail(email, password)
    if (ok) {
      window.location.href = getRoleRedirect(auth.user?.role?.type)
    } else {
      handleError(auth.error || "Sign in failed")
    }
  }

  async function handleRegister() {
    if (!email || !password) return handleError("Email and password required")
    if (!firstName) return handleError("First name is required")
    if (password.length < 8) return handleError("Password must be at least 8 characters")
    setLoading(true); setError("")
    const ok = await auth.register(email, password, firstName, lastName)
    if (ok) {
      setMode("otp-code")   // ✅ reuse existing OTP UI
      setLoading(false)
      setOtp("")            // ✅ clear any previous OTP value
    } else {
      handleError(auth.error || "Registration failed")
    }
  }

  async function handleRequestOTP() {
    if (!email) return handleError("Email required")
    setLoading(true); setError("")
    const ok = await auth.requestZohoOTP(email)
    setLoading(false)
    if (ok) { setOtpSent(true); setMode("otp-code") }
    else handleError("Could not send OTP — check your email address")
  }

  async function handleVerifyOTP() {
    if (!otp || otp.length < 4) return handleError("Enter the OTP from your email")
    setLoading(true); setError("")
    const ok = await auth.signInWithZohoOTP(email, otp)
    if (ok) {
      // New users (came from register) go to onboarding
      // Existing users (came from otp-email) go to home
      const isNewUser = !auth.user?.id // if no user yet, came from register flow
      window.location.href = isNewUser ? "/onboarding" : getRoleRedirect(auth.user?.role?.type)
    } else {
      handleError(auth.error || "Invalid or expired OTP")
    }
  }
  const SocialButton = ({
    label,
    icon,
    onClick,
  }: {
    label: string
    icon: React.ReactNode
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 active:scale-[0.98]"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      {label}
    </button>
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        {mode === "choose" ? (
          <Link href="/" className="rounded-lg p-2 hover:bg-accent transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <button
            onClick={() => { setMode("choose"); setError("") }}
            className="rounded-lg p-2 hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <span className="font-semibold">
          {mode === "choose"    ? "Sign in"            :
           mode === "register"  ? "Create account"     :
           mode === "otp-code"  ? "Enter OTP"          :
           mode === "otp-email" ? "Sign in with email" :
           "Sign in with password"}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <LogoSquare size={56} className="mb-6" />

        {error && (
          <div className="mb-4 w-full max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── Choose method ─────────────────────────────────────────────── */}
        {mode === "choose" && (
          <div className="w-full max-w-sm space-y-3">
            <SocialButton
              label="Continue with Google"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
              onClick={auth.signInWithGoogle}
            />
            <SocialButton
              label="Continue with Facebook"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              }
              onClick={auth.signInWithFacebook}
            />
            <SocialButton
              label="Continue with Apple"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              }
              onClick={auth.signInWithApple}
            />

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <button
              onClick={() => setMode("email")}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors active:scale-[0.98]"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              Continue with email & password
            </button>

            <button
              onClick={() => setMode("otp-email")}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent transition-colors active:scale-[0.98]"
            >
              <Mail className="h-5 w-5 text-muted-foreground" />
              Sign in with email OTP
            </button>

            <p className="pt-2 text-center text-xs text-muted-foreground">
              No account?{" "}
              <button
                onClick={() => setMode("register")}
                className="font-medium text-primary hover:underline"
              >
                Create one
              </button>
            </p>
          </div>
        )}

        {/* ── Email + password (sign in) ────────────────────────────────── */}
        {mode === "email" && (
          <div className="w-full max-w-sm space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()}
                  placeholder="Your password"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleEmailSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Sign in
            </button>

            <p className="text-center text-xs text-muted-foreground">
              <button
                onClick={() => setMode("otp-email")}
                className="text-primary hover:underline"
              >
                Forgot password? Use email OTP instead
              </button>
            </p>
          </div>
        )}

        {/* ── Register ─────────────────────────────────────────────────── */}
        {mode === "register" && (
          <div className="w-full max-w-sm space-y-3">

            {/* First name + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">First name <span className="text-destructive">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Last name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email <span className="text-destructive">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password <span className="text-destructive">*</span></label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Create account
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setMode("email")}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* ── OTP: enter email ──────────────────────────────────────────── */}
        {mode === "otp-email" && (
          <div className="w-full max-w-sm space-y-3">
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a one-time code to your email.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRequestOTP()}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoComplete="email"
                />
              </div>
            </div>
            <button
              onClick={handleRequestOTP}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send OTP
            </button>
          </div>
        )}

        {/* ── OTP: enter code ───────────────────────────────────────────── */}
        {mode === "otp-code" && (
          <div className="w-full max-w-sm space-y-3">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <p className="text-sm font-medium">Code sent to</p>
              <p className="text-sm font-semibold text-primary">{email}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">One-time code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                placeholder="Enter code"
                className="w-full rounded-xl border border-border bg-background py-3 px-4 text-center text-2xl font-bold tracking-[.5em] placeholder:text-sm placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoComplete="one-time-code"
              />
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify & sign in
            </button>
            <button
              onClick={handleRequestOTP}
              disabled={loading}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Didn&apos;t receive it? Resend code
            </button>
          </div>
        )}
      </div>
    </div>
  )
}