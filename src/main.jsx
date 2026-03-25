import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { inject } from '@vercel/analytics'
import App from './App'
import './index.css'

inject()

const container = document.getElementById('root')
if (container) {
  try {
    const root = createRoot(container)
    root.render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )
  } catch (err) {
    document.body.innerHTML = `<div style="padding: 2rem; color: #ef4444; font-family: sans-serif;">
      <h1>🔴 Render Error</h1>
      <pre>${err.message}\n${err.stack}</pre>
    </div>`
  }
} else {
  document.body.innerHTML = '<h1>🔴 Critical: Root not found</h1>'
}
