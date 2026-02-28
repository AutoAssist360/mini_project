import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import UserSignInPage from './pages/UserSignInPage'
import UserSignUpPage from './pages/UserSignUpPage'
import UserDashboardPage from './pages/UserDashboardPage'

function RequireAuth({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/auth/user/signin" replace />
  }
  return children
}

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('qa-user-theme')
    if (storedTheme) {
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('qa-user-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/user/signin" replace />} />
      <Route path="/auth/user/signin" element={<UserSignInPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/auth/user/signup" element={<UserSignUpPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth>
            <UserDashboardPage theme={theme} onToggleTheme={toggleTheme} />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/auth/user/signin" replace />} />
    </Routes>
  )
}

export default App
