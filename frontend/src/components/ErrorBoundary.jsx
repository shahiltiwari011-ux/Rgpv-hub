import { Component } from 'react'
import { logSystemError } from '../services/api'

export class ErrorBoundary extends Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError (error) {
    return { hasError: true, error }
  }

  componentDidCatch (error, info) {
    // Log to Supabase system_logs for monitoring
    logSystemError(error.message, {
      stack: error.stack?.slice(0, 1000),
      componentStack: info.componentStack?.slice(0, 500)
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render () {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😵</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className='btn-primary' onClick={this.handleReset}>
              Try Again
            </button>
            <button className='btn-secondary' onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
