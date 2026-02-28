import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  dashboard: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthTokens(state, action) {
      state.accessToken = action.payload.accessToken || null
      state.refreshToken = action.payload.refreshToken || null
      state.isAuthenticated = Boolean(action.payload.accessToken || action.payload.refreshToken)
    },
    setAuthUser(state, action) {
      state.user = action.payload || null
      state.isAuthenticated = Boolean(state.accessToken || state.refreshToken || state.user)
    },
    setDashboardSnapshot(state, action) {
      state.dashboard = action.payload || null
    },
    clearAuth(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      state.dashboard = null
      state.isAuthenticated = false
    },
  },
})

export const { setAuthTokens, setAuthUser, setDashboardSnapshot, clearAuth } = authSlice.actions
export default authSlice.reducer
