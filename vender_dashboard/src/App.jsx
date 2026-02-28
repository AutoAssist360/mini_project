import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import VendorSignInPage from './pages/VendorSignInPage'
import VendorSignUpPage from './pages/VendorSignUpPage'
import VendorDashboardPage from './pages/VendorDashboardPage'

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
      <Route path="/dashboard" element={<VendorDashboardPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="*" element={<Navigate to="/auth/vendor/signin" replace />} />
    </Routes>
  )
}

export default App
