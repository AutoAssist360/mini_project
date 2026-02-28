import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import VendorSignInPage from './pages/VendorSignInPage'
import VendorSignUpPage from './pages/VendorSignUpPage'
import VendorDashboardPage from './pages/VendorDashboardPage'

function RequireAuth({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/auth/vendor/signin" replace />
  }
  return children
}

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('qa-vendor-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-vendor-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/vendor/signin" replace />} />
      <Route path="/auth/vendor/signin" element={<VendorSignInPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/auth/vendor/signup" element={<VendorSignUpPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth>
            <VendorDashboardPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/auth/vendor/signin" replace />} />
    </Routes>
  )
}

export default App
