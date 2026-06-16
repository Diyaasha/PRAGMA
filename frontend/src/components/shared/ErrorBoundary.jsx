/**
 * PRAGMA — ErrorBoundary
 * Owner: Ashwin — M4 polish
 * Catches runtime render errors anywhere below it and shows a recoverable
 * card instead of a blank white screen. Must be a class component — React
 * only exposes error catching via getDerivedStateFromError / componentDidCatch.
 */

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected error' }
  }

  componentDidCatch(error, info) {
    console.error('[PRAGMA ErrorBoundary]', error, info)
  }

  reset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-500">{this.state.message}</p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={this.reset}
                className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
