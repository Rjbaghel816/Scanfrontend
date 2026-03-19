import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { TenantProvider } from './context/TenantContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TenantProvider>
        <App />
      </TenantProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)