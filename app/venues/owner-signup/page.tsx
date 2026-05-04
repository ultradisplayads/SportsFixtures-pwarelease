"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Phone, Tv, Building2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useLocation } from "@/components/location-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { gamificationManager } from "@/lib/gamification-manager"

export default function VenueOwnerSignupPage() {
  const { location, requestLocation, loading: locationLoading } = useLocation()
  const [formData, setFormData] = useState({
    ownerName: "",
    ownerEmail: "",
    password: "",
    confirmPassword: "",
    venueName: "",
    venueType: "bar",
    address: "",
    city: "",
    country: "",
    phone: "",
    whatsapp: "",
    lineId: "",
    screenCount: "",
    capacity: "",
    latitude: "",
    longitude: "",
    sports: [] as string[],
    hasPool: false,
    hasDarts: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    if (location) {
      setFormData((prev) => ({
        ...prev,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        city: location.city || prev.city,
        country: location.country || prev.country,
      }))
    }
  }, [location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    // Validation
    if (formData.password.length < 8) {
      return setSubmitError("Password must be at least 8 characters")
    }
    if (!/[A-Z]/.test(formData.password)) {
      return setSubmitError("Password must contain at least one uppercase letter")
    }
    if (!/[0-9]/.test(formData.password)) {
      return setSubmitError("Password must contain at least one number")
    }
    if (formData.password !== formData.confirmPassword) {
      return setSubmitError("Passwords do not match")
    }

    setSubmitting(true)
    triggerHaptic("medium")

    try {
      const res = await fetch("/api/venues/owner-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName:   formData.ownerName,
          ownerEmail:  formData.ownerEmail,
          ownerPhone:  formData.phone,
          password:    formData.password,
          venueName:   formData.venueName,
          venueType:   formData.venueType,
          address:     formData.address,
          city:        formData.city,
          country:     formData.country,
          whatsapp:    formData.whatsapp,
          lineId:      formData.lineId,
          screenCount: formData.screenCount,
          capacity:    formData.capacity,
          lat:         formData.latitude,
          lng:         formData.longitude,
          sports:      formData.sports,
          hasPool:     formData.hasPool,
          hasDarts:    formData.hasDarts,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Submission failed")
      gamificationManager.addPoints(50, "Venue owner signup")
      setSubmitted(true)
    } catch (err: any) {
      setSubmitError(err?.message ?? "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const toggleSport = (sport: string) => {
    triggerHaptic("selection")
    setFormData((prev) => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter((s) => s !== sport)
        : [...prev.sports, sport],
    }))
  }

  const handleGetLocation = () => {
    triggerHaptic("medium")
    requestLocation()
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold">Account Created!</h2>
          <p className="mt-2 text-muted-foreground">
            Welcome! Your venue <strong>{formData.venueName}</strong> has been registered.
            You can now sign in with <strong>{formData.ownerEmail}</strong>.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href="/auth/signin"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign In to Dashboard
            </a>
            <a
              href="/"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-bold">Venue Owner Sign Up</h1>
        <p className="text-sm text-muted-foreground">Join our network of sports venues</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4">

        {/* ── Account ── */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Lock className="h-5 w-5 text-primary" />
            Create Account
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Password *</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password *</label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm"
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Owner Information ── */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Mail className="h-5 w-5 text-primary" />
            Owner Information
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Your Name *</label>
              <input
                type="text"
                name="ownerName"
                required
                value={formData.ownerName}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address *</label>
              <input
                type="email"
                name="ownerEmail"
                required
                value={formData.ownerEmail}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>

        {/* ── Venue Information ── */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            Venue Information
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Venue Name *</label>
              <input
                type="text"
                name="venueName"
                required
                value={formData.venueName}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Sports Corner Bar"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Venue Type *</label>
              <select
                name="venueType"
                required
                value={formData.venueType}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="bar">Sports Bar</option>
                <option value="restaurant">Restaurant</option>
                <option value="pub">Pub</option>
                <option value="cafe">Cafe</option>
                <option value="club">Club</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Address *</label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Bangkok"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country *</label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="Thailand"
                />
              </div>
            </div>

            {/* Geolocation */}
            <div className="rounded-lg border border-border bg-accent/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium">Geolocation</label>
                  <p className="text-xs text-muted-foreground">Help customers find you</p>
                  {location && (
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {locationLoading ? "Getting..." : location ? "Update" : "Capture"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Contact Information ── */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Phone className="h-5 w-5 text-primary" />
            Contact Information
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="+66 2 123 4567"
              />
            </div>
            <div>
              <label className="text-sm font-medium">WhatsApp Number</label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="+66 812 345 678"
              />
            </div>
            <div>
              <label className="text-sm font-medium">LINE ID (Thailand)</label>
              <input
                type="text"
                name="lineId"
                value={formData.lineId}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="@sportscorner"
              />
            </div>
          </div>
        </div>

        {/* ── Venue Details ── */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Tv className="h-5 w-5 text-primary" />
            Venue Details
          </h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Number of Screens *</label>
                <input
                  type="number"
                  name="screenCount"
                  required
                  min="1"
                  value={formData.screenCount}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="8"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Capacity *</label>
                <input
                  type="number"
                  name="capacity"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  placeholder="120"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 text-sm font-medium">Sports You Show</label>
              <div className="flex flex-wrap gap-2">
                {["Football", "Basketball", "Tennis", "Rugby", "Cricket", "American Football"].map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      formData.sports.includes(sport)
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hasPool"
                  checked={formData.hasPool}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">We have Pool Tables</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="hasDarts"
                  checked={formData.hasDarts}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">We have Darts Boards</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Submit ── */}
        {submitError && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Creating Account..." : "Create Account & Register Venue"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By submitting, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>
    </div>
  )
}
