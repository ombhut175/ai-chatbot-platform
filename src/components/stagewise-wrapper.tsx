"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { StagewiseToolbar } from "@stagewise/toolbar-next"
import { ReactPlugin } from "@stagewise-plugins/react"

interface ErrorBoundaryState {
  hasError: boolean
}

class StagewiseErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Stagewise toolbar error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return null // Fail silently
    }

    return this.props.children
  }
}

export function StagewiseWrapper() {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <StagewiseErrorBoundary>
      <StagewiseToolbar 
        config={{ 
          plugins: [ReactPlugin] 
        }} 
      />
    </StagewiseErrorBoundary>
  )
} 