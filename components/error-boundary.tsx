'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <div className="text-center">
            <p className="text-xs font-bold tracking-wide-industrial uppercase mb-2">
              Something went wrong
            </p>
            <p className="text-[11px] text-muted-foreground tracking-industrial mb-4">
              Please refresh the page and try again.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="border border-foreground px-6 py-2.5 text-[10px] tracking-wide-industrial uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
