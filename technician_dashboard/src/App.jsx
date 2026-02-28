import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import TechnicianSignInPage from './pages/TechnicianSignInPage'
import TechnicianSignUpPage from './pages/TechnicianSignUpPage'
import TechnicianDashboardPage from './pages/TechnicianDashboardPage'

function RequireAuth({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/auth/technician/signin" replace />
  }
  return children
}

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('qa-technician-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-technician-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/technician/signin" replace />} />
      <Route path="/auth/technician/signin" element={<TechnicianSignInPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/auth/technician/signup" element={<TechnicianSignUpPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth>
            <TechnicianDashboardPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/auth/technician/signin" replace />} />
    </Routes>
  )
}

export default App
