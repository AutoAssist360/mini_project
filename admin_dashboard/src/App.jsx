import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'

function RequireAuth({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('qa-admin-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-admin-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route
        path="/admin/dashboard"
        element={(
          <RequireAuth>
            <AdminDashboardPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}

export default App
