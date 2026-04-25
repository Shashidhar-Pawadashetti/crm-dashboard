'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: string | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[NexCRM] Render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-lg fade-in">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              The application encountered an unexpected error:
            </p>
            <p className="text-sm text-destructive bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2 mb-5 font-mono break-all">
              {this.state.error}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
