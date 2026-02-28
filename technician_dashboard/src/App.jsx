import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TechnicianSignInPage from './pages/TechnicianSignInPage'
import TechnicianSignUpPage from './pages/TechnicianSignUpPage'
import TechnicianDashboardPage from './pages/TechnicianDashboardPage'

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
      <Route path="/dashboard" element={<TechnicianDashboardPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="*" element={<Navigate to="/auth/technician/signin" replace />} />
    </Routes>
  )
}

export default App
