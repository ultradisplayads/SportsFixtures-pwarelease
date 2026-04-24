"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: React.ReactNode
  label?: string
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary: ${this.props.label ?? "unknown"}]`, error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Something went wrong</p>
          {this.props.label && (
            <p className="text-xs text-muted-foreground">{this.props.label} failed to load</p>
          )}
        </div>
        <button
          onClick={() => this.setState({ hasError: false, error: undefined })}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Try again
        </button>
      </div>
    )
  }
}
