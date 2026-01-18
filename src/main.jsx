import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import { ToastProvider } from './components/ToastProvider'
import { ApiStatusProvider } from './components/ApiStatusProvider'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ApiStatusProvider>
        <ToastProvider>
          <AuthProvider>
            <FavoritesProvider>
    <App />
            </FavoritesProvider>
          </AuthProvider>
        </ToastProvider>
      </ApiStatusProvider>
    </HashRouter>
  </StrictMode>,
)
