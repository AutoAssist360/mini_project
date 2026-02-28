import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RoleSelectionPage from './pages/RoleSelectionPage'

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('qa-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/auth/role" element={<RoleSelectionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
