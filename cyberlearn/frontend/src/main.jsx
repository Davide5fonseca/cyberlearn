import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { UIProvider } from './components/ui/UIProvider.jsx'

// Limpeza de chaves antigas: a cache de avatares nunca era lida nem removida
// e podia estourar a quota do localStorage.
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('cyberlearn_avatar_'))
    .forEach((k) => localStorage.removeItem(k));
} catch { /* storage indisponível */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <UIProvider>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </UIProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
